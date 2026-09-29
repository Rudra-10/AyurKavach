import {
  ClassifyRequest,
  ClassifyResponse,
  KnowledgeSourceItem,
  QueryRequest,
  QueryResponse,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}

export async function classifyFormulation(
  request: ClassifyRequest
): Promise<ClassifyResponse> {
  const res = await fetch(`${API_BASE_URL}/classify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Classification failed: ${errorText || res.statusText}`);
  }

  return res.json();
}

export interface StreamCallbacks {
  onToken: (text: string) => void;
  onFinal: (response: QueryResponse) => void;
  onError: (error: Error) => void;
}

export async function streamQuery(
  request: QueryRequest,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errorText || response.statusText}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const block of lines) {
        if (!block.trim()) continue;

        let eventType = "message";
        let eventData = "";

        const eventLines = block.split("\n");
        for (const line of eventLines) {
          if (line.startsWith("event:")) {
            eventType = line.replace("event:", "").trim();
          } else if (line.startsWith("data:")) {
            eventData = line.replace("data:", "").trim();
          }
        }

        if (!eventData) continue;

        try {
          const parsed = JSON.parse(eventData);
          if (eventType === "token") {
            callbacks.onToken(parsed.text);
          } else if (eventType === "final") {
            callbacks.onFinal(parsed as QueryResponse);
          }
        } catch (parseErr) {
          console.error("Failed to parse SSE JSON block:", eventData, parseErr);
        }
      }
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      return;
    }
    callbacks.onError(err);
  }
}
