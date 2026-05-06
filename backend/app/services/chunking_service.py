from dataclasses import dataclass


@dataclass
class TextChunk:
    content: str
    char_start: int
    char_end: int


class ChunkingService:
    def __init__(self, chunk_size: int = 1200, overlap: int = 180):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_text(self, text: str) -> list[TextChunk]:
        normalized = "\n".join(line.rstrip() for line in text.splitlines()).strip()
        if not normalized:
            return []

        chunks: list[TextChunk] = []
        start = 0
        text_length = len(normalized)
        while start < text_length:
            end = min(start + self.chunk_size, text_length)
            window = normalized[start:end]
            split_at = max(window.rfind("\n\n"), window.rfind(". "), window.rfind("\n"))
            if split_at > self.chunk_size * 0.45 and end < text_length:
                end = start + split_at + 1
                window = normalized[start:end]
            chunks.append(TextChunk(content=window.strip(), char_start=start, char_end=end))
            if end >= text_length:
                break
            start = max(end - self.overlap, start + 1)
        return chunks

