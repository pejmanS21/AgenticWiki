import asyncio
from pathlib import Path

import fitz
import pytesseract
from PIL import Image


class TextExtractionService:
    async def extract_text(self, file_path: str, mime_type: str) -> str:
        path = Path(file_path)
        suffix = path.suffix.lower()
        if mime_type == "application/pdf" or suffix == ".pdf":
            return await asyncio.to_thread(self._extract_pdf, path)
        if mime_type.startswith("image/") or suffix in {".png", ".jpg", ".jpeg", ".webp", ".tiff"}:
            return await asyncio.to_thread(self._extract_image, path)
        if suffix in {".md", ".markdown", ".txt"} or mime_type.startswith("text/"):
            return await asyncio.to_thread(path.read_text, encoding="utf-8", errors="ignore")
        return await asyncio.to_thread(path.read_text, encoding="utf-8", errors="ignore")

    def _extract_pdf(self, path: Path) -> str:
        parts: list[str] = []
        with fitz.open(path) as document:
            for index, page in enumerate(document):
                text = page.get_text("text").strip()
                if text:
                    parts.append(f"\n\n[Page {index + 1}]\n{text}")
        return "\n".join(parts).strip()

    def _extract_image(self, path: Path) -> str:
        with Image.open(path) as image:
            return pytesseract.image_to_string(image).strip()

