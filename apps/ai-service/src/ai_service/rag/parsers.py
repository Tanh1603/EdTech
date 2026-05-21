from dataclasses import dataclass


@dataclass(frozen=True)
class ParsedDocument:
    material_id: str
    title: str
    text: str


class TextParser:
    def parse(self, material_id: str, title: str, content: str) -> ParsedDocument:
        return ParsedDocument(material_id=material_id, title=title, text=content.strip())
