import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile
from app.config import settings

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
MAX_SIZE_MB = 10


async def save_file(file: UploadFile, subfolder: str = "prescriptions") -> tuple[str, str]:
    """
    Save uploaded file to local storage or S3.
    Returns (file_url, local_path)
    """
    if file.content_type not in ALLOWED_TYPES:
        raise ValueError(f"File type {file.content_type} not allowed")

    ext = Path(file.filename or "file.jpg").suffix.lower()
    filename = f"{uuid.uuid4().hex}{ext}"

    if settings.STORAGE_BACKEND == "s3":
        return await _save_s3(file, filename, subfolder), filename
    else:
        return await _save_local(file, filename, subfolder)


async def _save_local(file: UploadFile, filename: str, subfolder: str) -> tuple[str, str]:
    upload_dir = Path(settings.LOCAL_UPLOAD_DIR) / subfolder
    upload_dir.mkdir(parents=True, exist_ok=True)
    local_path = str(upload_dir / filename)

    content = await file.read()
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise ValueError(f"File too large (max {MAX_SIZE_MB}MB)")

    async with aiofiles.open(local_path, "wb") as f:
        await f.write(content)

    url = f"/uploads/{subfolder}/{filename}"
    return url, local_path


async def _save_s3(file: UploadFile, filename: str, subfolder: str) -> str:
    import boto3
    s3 = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )
    key = f"{subfolder}/{filename}"
    content = await file.read()
    s3.put_object(Bucket=settings.AWS_BUCKET_NAME, Key=key, Body=content)
    return f"https://{settings.AWS_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
