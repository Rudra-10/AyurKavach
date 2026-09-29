"""
Minimal smoke-test: calls /health + /cache/stats then streams one demo question.
Run this from the repo root with your venv active:
    python backend/scripts/smoke_test.py [--base-url http://localhost:8000]
"""
import argparse
import asyncio
import json
import sys
import time
import httpx


async def main(base_url: str):
    url_health = f"{base_url}/health"
    url_stats  = f"{base_url}/cache/stats"
    url_query  = f"{base_url}/query"

    print(f"\nSmoke-testing {base_url} …\n")

    # 1. Health
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url_health)
        print(f"GET /health → {r.status_code}: {r.text}")
        assert r.status_code == 200, "Health check failed"

        # 2. Cache stats
        r2 = await client.get(url_stats)
        print(f"GET /cache/stats → {r2.status_code}: {r2.text}")

    # 3. SSE query (Q1 – turmeric)
    body = {
        "question": "Can I patent an Ayurvedic formulation using turmeric?",
        "jurisdiction": "india",
        "lang": "en",
    }
    print(f"\nPOST /query … (streaming)")
    t0 = time.perf_counter()
    ttft_ms = None
    final = None

    async with httpx.AsyncClient(timeout=httpx.Timeout(60, connect=10)) as client:
        async with client.stream("POST", url_query, json=body) as resp:
            print(f"  status: {resp.status_code}")
            async for line in resp.aiter_lines():
                line = line.strip()
                if not line:
                    continue
                if line.startswith("data:"):
                    data = json.loads(line[5:].strip())
                    if "text" in data and ttft_ms is None:
                        ttft_ms = round((time.perf_counter() - t0) * 1000, 1)
                        print(f"  TTFT = {ttft_ms} ms")
                    if "answer" in data:
                        final = data

    if final:
        print(f"\n  confidence: {final.get('confidence')}")
        print(f"  citations:  {len(final.get('citations', []))}")
        print(f"  conflict_flag: {final.get('conflict_flag')}")
        print(f"  answer[:120]: {final.get('answer','')[:120]}")
    else:
        print("  ⛔  No final payload received.")
        sys.exit(1)

    print("\n✅ Smoke-test passed.\n")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--base-url", default="http://localhost:8000")
    args = p.parse_args()
    asyncio.run(main(args.base_url))
