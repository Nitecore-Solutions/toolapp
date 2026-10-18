import os
import uuid
import tempfile
from typing import Optional


TEMP_DIR = os.path.join(tempfile.gettempdir(), "bjr_tool_temp")
os.makedirs(TEMP_DIR, exist_ok=True)


def save_temp_file(content: bytes, extension: str = "jpg") -> str:
    """Save bytes to a temporary file and return the path."""
    filename = f"{uuid.uuid4().hex}.{extension}"
    filepath = os.path.join(TEMP_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    return filepath


def cleanup_file(filepath: str) -> None:
    """Delete a temporary file if it exists."""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except Exception:
        pass


def get_file_extension(filename: str) -> str:
    """Extract file extension from filename."""
    if '.' in filename:
        return filename.rsplit('.', 1)[1].lower()
    return ''


ALLOWED_IMAGE_TYPES = {'jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'tiff'}
ALLOWED_PDF_TYPES = {'pdf'}


def is_allowed_image(filename: str) -> bool:
    return get_file_extension(filename) in ALLOWED_IMAGE_TYPES


def is_allowed_pdf(filename: str) -> bool:
    return get_file_extension(filename) in ALLOWED_PDF_TYPES
