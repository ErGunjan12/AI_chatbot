import hashlib
import numpy as np
from typing import List, Optional
from openai import OpenAI
from app.core.config import settings

class EmbeddingService:
    def __init__(self):
        self.client: Optional[OpenAI] = None
        if settings.OPENAI_API_KEY:
            try:
                self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
            except Exception as e:
                print(f"[EmbeddingService] OpenAI client init warning: {e}")

    def _fallback_embedding(self, text: str, dim: int = 384) -> List[float]:
        """
        Deterministic, dense semantic vector generator for offline fallback and unit testing.
        Projects character n-grams and token hashes into normalized unit hypersphere.
        """
        vec = np.zeros(dim, dtype=np.float32)
        words = text.lower().split()
        if not words:
            return vec.tolist()

        for idx, word in enumerate(words):
            h = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
            pos = h % dim
            sign = 1.0 if (h >> 8) % 2 == 0 else -1.0
            weight = 1.0 / (idx + 1) ** 0.3
            vec[pos] += sign * weight

        # Also encode character trigrams for typo resilience
        for i in range(len(text) - 2):
            tri = text[i:i+3].lower()
            h = int(hashlib.sha256(tri.encode('utf-8')).hexdigest(), 16)
            pos = h % dim
            vec[pos] += 0.2

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def get_embedding(self, text: str) -> List[float]:
        """Generates embedding vector for a single string."""
        if not text:
            return [0.0] * 384

        if self.client and settings.OPENAI_API_KEY:
            try:
                response = self.client.embeddings.create(
                    model=settings.EMBEDDING_MODEL,
                    input=text
                )
                return response.data[0].embedding
            except Exception as e:
                print(f"[EmbeddingService] OpenAI embedding failed, using local dense fallback: {e}")
                return self._fallback_embedding(text)
        return self._fallback_embedding(text)

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generates embedding vectors for a batch of strings."""
        if not texts:
            return []

        if self.client and settings.OPENAI_API_KEY:
            try:
                response = self.client.embeddings.create(
                    model=settings.EMBEDDING_MODEL,
                    input=texts
                )
                return [d.embedding for d in response.data]
            except Exception as e:
                print(f"[EmbeddingService] Batch OpenAI embeddings failed, using fallback: {e}")
                return [self._fallback_embedding(t) for t in texts]

        return [self._fallback_embedding(t) for t in texts]

embedding_service = EmbeddingService()
