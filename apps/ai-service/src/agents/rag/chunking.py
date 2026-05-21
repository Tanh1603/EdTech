from dataclasses import dataclass

from agents.rag.parsers import ParsedDocument


@dataclass(frozen=True)
class TextChunk:
    material_id: str
    chunk_id: str
    title: str
    content: str
    order_no: int


class SimpleChunker:
    def __init__(self, max_words: int = 120) -> None:
        self.max_words = max_words

    def chunk(self, document: ParsedDocument) -> list[TextChunk]:
        words = document.text.split()
        if not words:
            return []
        chunks: list[TextChunk] = []
        for index in range(0, len(words), self.max_words):
            order_no = len(chunks) + 1
            content = " ".join(words[index : index + self.max_words])
            chunks.append(
                TextChunk(
                    material_id=document.material_id,
                    chunk_id=f"{document.material_id}:chunk:{order_no}",
                    title=document.title,
                    content=content,
                    order_no=order_no,
                )
            )
        return chunks
