from fastapi import APIRouter, UploadFile, File, Form, Response
from services.image_service import ImageService
from typing import Optional

router = APIRouter(prefix="/api/image", tags=["Overlay Tools"])

@router.post("/add-name-date")
async def add_name_date(
    file: UploadFile = File(...),
    name: str = Form(...),
    date_str: str = Form(""),
    position: str = Form("bottom"),
    font_size: int = Form(24)
):
    contents = await file.read()
    try:
        processed_image = ImageService.add_name_and_date(
            contents, 
            name=name, 
            date_str=date_str, 
            position=position, 
            font_size=font_size
        )
        return Response(content=processed_image, media_type="image/jpeg")
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"detail": str(e), "traceback": error_msg})

@router.post("/join-photo-signature")
async def join_photo_signature(
    photo: UploadFile = File(...),
    signature: UploadFile = File(...)
):
    photo_bytes = await photo.read()
    signature_bytes = await signature.read()
    processed_image = ImageService.join_photo_signature(photo_bytes, signature_bytes)
    return Response(content=processed_image, media_type="image/jpeg")


@router.post("/overlay-cloth")
async def overlay_cloth(
    file: UploadFile = File(...),
    cloth_url: str = Form(...),
    scale: float = Form(1.0),
    x: float = Form(0.0),
    y: float = Form(0.0)
):
    contents = await file.read()
    try:
        processed_image = ImageService.overlay_cloth(contents, cloth_url, scale, x, y)
        return Response(content=processed_image, media_type="image/png")
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"detail": str(e), "traceback": error_msg})


@router.post("/overlay-cloth-advanced")
async def overlay_cloth_advanced(
    file: UploadFile = File(...),
    cloth_file: Optional[UploadFile] = File(None),
    cloth_url: Optional[str] = Form(None),
    cloth_id: Optional[str] = Form(None),
    person_scale_w: float = Form(...),
    person_scale_h: float = Form(...),
    person_x: float = Form(...),
    person_y: float = Form(...),
    cloth_scale_w: float = Form(...),
    cloth_scale_h: float = Form(...),
    cloth_x: float = Form(...),
    cloth_y: float = Form(...),
):
    contents = await file.read()
    cloth_contents = await cloth_file.read() if cloth_file else None
    
    try:
        processed_image = ImageService.overlay_cloth_advanced(
            contents, cloth_url, cloth_contents,
            person_scale_w, person_scale_h, person_x, person_y,
            cloth_scale_w, cloth_scale_h, cloth_x, cloth_y, cloth_id
        )
        return Response(content=processed_image, media_type="image/png")
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"detail": str(e), "traceback": error_msg})
