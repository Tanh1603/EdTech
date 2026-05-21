from typing import Protocol


class EmbeddingProvider(Protocol):
    def embed(self, text: str) -> list[float]:
        raise NotImplementedError


class FakeEmbeddingProvider:
    dimension = 8
    model = "fake-embedding"

    def embed(self, text: str) -> list[float]:
        values = [0.0] * self.dimension
        for index, char in enumerate(text.encode("utf-8")):
            values[index % self.dimension] += (char % 31) / 31.0
        magnitude = sum(abs(value) for value in values) or 1.0
        return [round(value / magnitude, 6) for value in values]
