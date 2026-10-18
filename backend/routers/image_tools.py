from fastapi import APIRouter, UploadFile, File, Form, Response, Request, HTTPException
from typing import Optional
from services.image_service import ImageService
from deps import limiter

router = APIRouter(prefix="/api/image", tags=["Image Tools"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB max

@router.post("/resize")
async def resize_image(
    file: UploadFile = File(...),
    width: float = Form(...),
    height: float = Form(...),
    unit: str = Form("pixels"),
    format: str = Form("jpeg"),
    target_kb: Optional[int] = Form(None)
):
    contents = await file.read()
    processed_image = ImageService.resize_image(contents, width, height, unit, format, target_kb)
    mt = f"image/{format.lower()}"
    if format.lower() == "jpg":
        mt = "image/jpeg"
    return Response(content=processed_image, media_type=mt)

@router.post("/compress-to-kb")
async def compress_image(
    file: UploadFile = File(...),
    target_kb: int = Form(...)
):
    contents = await file.read()
    processed_image = ImageService.compress_to_kb(contents, target_kb)
    return Response(content=processed_image, media_type="image/jpeg")

@router.post("/convert-format")
async def convert_format(
    file: UploadFile = File(...),
    target_format: str = Form(...)
):
    contents = await file.read()
    processed_image = ImageService.convert_format(contents, target_format)
    # Return correct media type based on format
    mt = f"image/{target_format.lower()}"
    return Response(content=processed_image, media_type=mt)

@router.post("/dpi")
async def change_dpi(
    file: UploadFile = File(...),
    dpi: int = Form(...)
):
    contents = await file.read()
    processed_image = ImageService.change_dpi(contents, dpi)
    return Response(content=processed_image, media_type="image/jpeg")

@router.post("/filter")
async def apply_filter(
    file: UploadFile = File(...),
    filter_type: str = Form(...),
    intensity: float = Form(1.0)
):
    contents = await file.read()
    processed_image = ImageService.apply_filter(contents, filter_type, intensity)
    return Response(content=processed_image, media_type="image/jpeg")

@router.post("/remove-bg")
@limiter.limit("5/minute")   # ek IP se max 5 calls/minute
async def remove_background(
    request: Request,
    file: UploadFile = File(...),
    mode: str = Form("auto")
):
    from services.bg_remove_service import BgRemoveService
    contents = await file.read()

    # File size check — 10MB se badi image reject
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum allowed size is 10MB."
        )

    # File type check
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type. Please upload JPG, PNG or WebP."
        )

    try:
        processed_image = BgRemoveService.remove_background(contents, mode)
        return Response(content=processed_image, media_type="image/png")
    except Exception as e:
        print(f"[REMOVE BG ERROR] {e}", flush=True)
        raise HTTPException(status_code=500, detail="Background removal failed. Please try again.")

@router.post("/passport-photo")
async def passport_photo(
    file: UploadFile = File(...),
    min_kb: int = Form(20),
    max_kb: int = Form(50),
    width: float = Form(3.5),
    height: float = Form(4.5),
    unit: str = Form("cm"),
    dpi: int = Form(300),
    brightness: float = Form(1.0),
    contrast: float = Form(1.0),
    saturation: float = Form(1.0),
    zoom: float = Form(1.0),
    shift_x: float = Form(0.0),
    shift_y: float = Form(0.0),
    name: Optional[str] = Form(None),
    date_str: Optional[str] = Form(None)
):
    import io
    contents = await file.read()
    print(f"[PASSPORT ROUTER] params received: min_kb={min_kb}, max_kb={max_kb}, w={width}, h={height}, unit={unit}, dpi={dpi}, brightness={brightness}, contrast={contrast}, saturation={saturation}, zoom={zoom}, shift_x={shift_x}, shift_y={shift_y}, name={name}, date_str={date_str}", flush=True)
    processed_image = ImageService.make_passport_photo(
        contents, min_kb, max_kb, width, height, unit, dpi,
        brightness, contrast, saturation, zoom, shift_x, shift_y
    )
    if name or date_str:
        processed_image = ImageService.add_name_and_date(
            processed_image,
            name=name or "",
            date_str=date_str or ""
        )
        from PIL import Image as PILImage
        from utils.compressor import compress_to_target_kb
        img_temp = PILImage.open(io.BytesIO(processed_image))
        processed_image = compress_to_target_kb(img_temp, min_kb, max_kb, format='JPEG', allow_resize=False)
    return Response(content=processed_image, media_type="image/jpeg")

@router.post("/signature-resizer")
async def signature_resizer(
    file: UploadFile = File(...),
    min_kb: int = Form(10),
    max_kb: int = Form(20),
    width: float = Form(140),
    height: float = Form(60),
    unit: str = Form("pixels"),
    dpi: int = Form(200)
):
    contents = await file.read()
    processed_image = ImageService.resize_signature(contents, min_kb, max_kb, width, height, unit, dpi)
    return Response(content=processed_image, media_type="image/jpeg")

@router.post("/insta-profile")
async def create_insta_profile(
    file: UploadFile = File(...),
    border_color: str = Form("gradient")
):
    contents = await file.read()
    processed_image = ImageService.make_insta_profile(contents, border_color)
    return Response(content=processed_image, media_type="image/png")

@router.post("/passport-sheet")
async def passport_sheet(
    file: UploadFile = File(...),
    sheet_type: str = Form("A4"),
    sheet_w: float = Form(210.0),
    sheet_h: float = Form(297.0)
):
    contents = await file.read()
    processed_image = ImageService.make_passport_sheet(contents, sheet_type, sheet_w, sheet_h)
    return Response(content=processed_image, media_type="image/png")
