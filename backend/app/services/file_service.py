import mimetypes
from pathlib import Path
from uuid import uuid4

import aiofiles
from fastapi import UploadFile

from app.config import get_settings


class FileService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def save_upload(self, file: UploadFile) -> tuple[str, str]:
        safe_name = Path(file.filename or "upload.bin").name
        target_name = f"{uuid4().hex}_{safe_name}"
        target_path = self.settings.upload_dir / target_name
        async with aiofiles.open(target_path, "wb") as out_file:
            while chunk := await file.read(1024 * 1024):
                await out_file.write(chunk)
        mime_type = file.content_type or mimetypes.guess_type(safe_name)[0] or "application/octet-stream"
        return str(target_path), mime_type

