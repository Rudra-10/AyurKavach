"""
Application configuration and environment settings.
"""
from typing import List, Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # API & Service
    APP_NAME: str = "IP-SAKTI Sahayak API"
    DEBUG: bool = False
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Qdrant Vector Database
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION: str = "ayurveda_ip_corpus"

    # Embeddings API (BGE-M3)
    EMBEDDING_API_URL: str = "https://api.together.xyz/v1/embeddings"
    EMBEDDING_API_KEY: str = ""
    EMBEDDING_MODEL: str = "BAAI/bge-m3"

    # Reranker API (BGE-reranker-v2-m3)
    RERANKER_API_URL: str = "https://api.together.xyz/v1/rerank"
    RERANKER_API_KEY: str = ""
    RERANKER_MODEL: str = "BAAI/bge-reranker-v2-m3"

    # Generation LLM
    LLM_PROVIDER: Literal["gemini", "anthropic"] = "gemini"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20240620"

    # Confidence Thresholds
    CONFIDENCE_HIGH_THRESHOLD: float = 0.75
    CONFIDENCE_MEDIUM_THRESHOLD: float = 0.45

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
