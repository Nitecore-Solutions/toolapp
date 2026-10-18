from fastapi import APIRouter, UploadFile, File, Form, Response, HTTPException
from typing import Optional
import json
import os
import io
from PIL import Image
from utils.compressor import compress_to_target_kb

router = APIRouter(prefix="/api/form", tags=["Govt Form Tools"])

PRESETS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "presets.json")

def load_presets():
    if os.path.exists(PRESETS_PATH):
        try:
            with open(PRESETS_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

@router.get("/presets")
def get_presets():
    return load_presets()

@router.post("/{exam_code}/{type_code}-resize")
async def resize_form_image(
    exam_code: str,
    type_code: str, # "photo" or "signature"
    file: UploadFile = File(...),
    max_kb: Optional[int] = Form(None),  # client can override compression target
):
    presets = load_presets()
    if exam_code not in presets:
        raise HTTPException(status_code=404, detail="Exam not found in presets")
        
    exam_presets = presets[exam_code]
    if type_code not in exam_presets:
        raise HTTPException(status_code=404, detail="Image type not found in exam presets")
        
    spec = exam_presets[type_code]
    
    contents = await file.read()
    try:
        img = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    if img.mode != 'RGB':
        img = img.convert('RGB')
        
    # Calculate target dimensions in pixels
    width = spec.get("width")
    height = spec.get("height")
    
    if not width and "width_cm" in spec:
        # Convert cm to pixels @ 300 DPI
        width = int(spec["width_cm"] * 300 / 2.54)
        height = int(spec["height_cm"] * 300 / 2.54)
        
    if not width or not height:
        width, height = 200, 200
        
    # Crop to correct aspect ratio first (center-crop)
    target_ratio = width / height
    current_ratio = img.width / img.height
    if current_ratio > target_ratio:
        new_width = int(img.height * target_ratio)
        left = (img.width - new_width) // 2
        img = img.crop((left, 0, left + new_width, img.height))
    elif current_ratio < target_ratio:
        new_height = int(img.width / target_ratio)
        top = (img.height - new_height) // 2
        img = img.crop((0, top, img.width, top + new_height))
        
    # Resize to exact dimensions
    img = img.resize((width, height), Image.Resampling.LANCZOS)
    
    # Compress based on min_kb and max_kb (client override takes precedence)
    min_kb = spec.get("min_kb", 0)
    max_kb = max_kb if max_kb is not None else spec.get("max_kb", 20)
    
    target_format = spec.get("format", "jpg").upper()
    if target_format == 'JPG':
        target_format = 'JPEG'
        
    compressed_bytes = compress_to_target_kb(img, min_kb, max_kb, format=target_format)
    
    media_type = f"image/{target_format.lower()}"
    return Response(content=compressed_bytes, media_type=media_type)
