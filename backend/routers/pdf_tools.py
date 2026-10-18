from fastapi import APIRouter, UploadFile, File, Form, Response
from fastapi.responses import JSONResponse
from services.pdf_service import PdfService
from services.biodata_service import BiodataService
from typing import List, Optional
import io
import zipfile
import base64
import json
from pypdf import PdfReader
from models.schemas import PdfElement

router = APIRouter(prefix="/api/pdf", tags=["PDF Tools"])


@router.post("/image-to-pdf")
async def images_to_pdf(
    files: List[UploadFile] = File(...),
    page_size: str = Form("A4"),
    orientation: str = Form("Portrait"),
    margin: float = Form(10.0)
):
    """Convert one or more images to a single PDF with layout choices."""
    image_bytes_list = []
    for f in files:
        image_bytes_list.append(await f.read())

    pdf_bytes = PdfService.images_to_pdf(image_bytes_list, page_size, orientation, margin)
    return Response(content=pdf_bytes, media_type="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=output.pdf"})


@router.post("/pdf-to-jpg")
async def pdf_to_jpg(
    file: UploadFile = File(...),
    fmt: str = Form("png"),
    as_json: bool = Form(False)
):
    """Convert PDF pages to custom format images. Returns a zip or JSON list of base64 images."""
    contents = await file.read()
    images = PdfService.pdf_to_images(contents, fmt)

    ext = fmt.lower()
    if ext == "jpeg":
        ext = "jpg"
    media_type = f"image/{ext}" if ext != "jpg" else "image/jpeg"

    if as_json:
        images_base64 = []
        for img_bytes in images:
            b64 = base64.b64encode(img_bytes).decode("utf-8")
            images_base64.append(f"data:{media_type};base64,{b64}")
        return JSONResponse(content={
            "images": images_base64,
            "count": len(images),
            "format": ext
        })

    if len(images) == 1:
        img_bytes = images[0]
        return Response(content=img_bytes, media_type=media_type,
                        headers={"Content-Disposition": f"attachment; filename=pdf_page.{ext}"})

    # Pack all images into a ZIP for multiple pages
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        for i, img_bytes in enumerate(images):
            zf.writestr(f"page_{i + 1}.{ext}", img_bytes)
    zip_buffer.seek(0)

    return Response(content=zip_buffer.getvalue(), media_type="application/zip",
                    headers={"Content-Disposition": f"attachment; filename=pdf_pages_{ext}.zip"})


@router.post("/merge")
async def merge_pdfs(files: List[UploadFile] = File(...)):
    """Merge multiple PDF files into one."""
    pdf_list = []
    for f in files:
        pdf_list.append(await f.read())

    merged = PdfService.merge_pdfs(pdf_list)
    return Response(content=merged, media_type="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=merged.pdf"})


@router.post("/split")
async def split_pdf(file: UploadFile = File(...), page_ranges: str = Form(...)):
    """Split a PDF by page ranges. E.g. '1-3,5,7-9'. Returns a zip."""
    contents = await file.read()
    try:
        parts = PdfService.split_pdf(contents, page_ranges)
    except ValueError as ve:
        return JSONResponse(
            status_code=400,
            content={"detail": str(ve)}
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to split PDF: {str(e)}"}
        )

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        for i, part in enumerate(parts):
            zf.writestr(f"part_{i + 1}.pdf", part)
    zip_buffer.seek(0)

    return Response(content=zip_buffer.getvalue(), media_type="application/zip",
                    headers={"Content-Disposition": "attachment; filename=split_parts.zip"})


@router.post("/rotate")
async def rotate_pdf(file: UploadFile = File(...), angle: int = Form(90)):
    """Rotate all pages of a PDF by the given angle (90, 180, 270)."""
    contents = await file.read()
    rotated = PdfService.rotate_pdf(contents, angle)
    return Response(content=rotated, media_type="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=rotated.pdf"})


@router.post("/render-pages")
async def render_pages(file: UploadFile = File(...), dpi: int = Form(130)):
    """Convert PDF pages to a list of base64 JPEG images and metadata (memory-optimized for mobile)."""
    contents = await file.read()

    # Clamp DPI to reasonable range (72 to 160) to prevent mobile Hermes OOM crashes
    dpi = max(72, min(dpi, 160))

    # 1. Get dimensions from pypdf
    try:
        reader = PdfReader(io.BytesIO(contents))
        page_dimensions = []
        for page in reader.pages:
            w = float(page.mediabox.width)
            h = float(page.mediabox.height)
            page_dimensions.append({"width": w, "height": h})
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"detail": f"Failed to read PDF pages: {str(e)}"}
        )

    # 2. Get JPEG bytes of rendered pages
    try:
        images_bytes = PdfService.pdf_to_images(contents, fmt="jpg", dpi=dpi)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to render PDF pages: {str(e)}"}
        )

    # 3. Convert to base64 data URIs
    pages_base64 = []
    for img_bytes in images_bytes:
        encoded = base64.b64encode(img_bytes).decode("utf-8")
        pages_base64.append(f"data:image/jpeg;base64,{encoded}")

    # 4. Extract existing text elements
    existing_elements = PdfService.extract_text_elements(contents)

    return {
        "pages": pages_base64,
        "dimensions": page_dimensions,
        "existing_elements": existing_elements
    }


@router.post("/page-thumbnails")
async def page_thumbnails(file: UploadFile = File(...)):
    """Return low-resolution page thumbnails for navigation strip."""
    contents = await file.read()

    try:
        images_bytes = PdfService.pdf_to_images(contents, fmt="png", dpi=72)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to generate thumbnails: {str(e)}"}
        )

    # Resize thumbnails to max 120px wide
    thumbnails_base64 = []
    for img_bytes in images_bytes:
        try:
            from PIL import Image as PILImage
            img = PILImage.open(io.BytesIO(img_bytes))
            max_width = 120
            if img.width > max_width:
                ratio = max_width / img.width
                new_size = (max_width, int(img.height * ratio))
                img = img.resize(new_size, PILImage.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format="PNG", optimize=True)
            encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
            thumbnails_base64.append(f"data:image/png;base64,{encoded}")
        except Exception:
            thumbnails_base64.append("")

    return {"thumbnails": thumbnails_base64}


@router.post("/apply-edits")
async def apply_edits(
    file: UploadFile = File(...),
    edits_json: str = Form(...)
):
    """Apply visual text overlays, whiteouts, and signatures onto the PDF."""
    contents = await file.read()
    try:
        edits_raw = json.loads(edits_json)
        edits = [PdfElement(**item) for item in edits_raw]
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"detail": f"Invalid edits JSON format or schema validation error: {str(e)}"}
        )

    try:
        edited_pdf_bytes = PdfService.apply_edits(contents, edits)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to edit PDF content: {str(e)}"}
        )

    return Response(
        content=edited_pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=edited.pdf"}
    )


@router.post("/compress")
async def compress_pdf(
    file: UploadFile = File(...),
    target_kb: int = Form(200)
):
    """Compress PDF size to target KB range."""
    contents = await file.read()
    try:
        compressed_pdf_bytes = PdfService.compress_pdf(contents, target_kb)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to compress PDF: {str(e)}"}
        )

    return Response(
        content=compressed_pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=compressed_{target_kb}kb.pdf"}
    )


@router.post("/biodata")
async def generate_biodata(
    # Template
    template_id: int = Form(1),
    # Personal
    header_left: str = Form(""),
    header_right: str = Form(""),
    name: str = Form(""),
    dob: str = Form(""),
    tob: str = Form(""),
    pob: str = Form(""),
    gotra: str = Form(""),
    hobbies: str = Form(""),
    complexion: str = Form(""),
    height: str = Form(""),
    religion_caste: str = Form(""),
    education: str = Form(""),
    occupation: str = Form(""),
    # Family
    grandfather_name: str = Form(""),
    grandfather_occupation: str = Form(""),
    grandmother_name: str = Form(""),
    grandmother_occupation: str = Form(""),
    father_name: str = Form(""),
    father_occupation: str = Form(""),
    mother_name: str = Form(""),
    mother_occupation: str = Form(""),
    # Contact
    contact_number: str = Form(""),
    address: str = Form(""),
    email: str = Form(""),
    # Photos (optional)
    profile_photo: Optional[UploadFile] = File(None),
    fullscreen_photo: Optional[UploadFile] = File(None),
):
    """Generate a styled Marriage Bio Data PDF."""
    profile_bytes = await profile_photo.read() if profile_photo and profile_photo.filename else None
    fullscreen_bytes = await fullscreen_photo.read() if fullscreen_photo and fullscreen_photo.filename else None

    try:
        pdf_bytes = BiodataService.generate_biodata(
            template_id=template_id,
            header_left=header_left, header_right=header_right,
            name=name, dob=dob, tob=tob, pob=pob,
            gotra=gotra, hobbies=hobbies, complexion=complexion,
            height=height, religion_caste=religion_caste,
            education=education, occupation=occupation,
            grandfather_name=grandfather_name, grandfather_occupation=grandfather_occupation,
            grandmother_name=grandmother_name, grandmother_occupation=grandmother_occupation,
            father_name=father_name, father_occupation=father_occupation,
            mother_name=mother_name, mother_occupation=mother_occupation,
            contact_number=contact_number, address=address, email=email,
            profile_photo_bytes=profile_bytes,
            fullscreen_photo_bytes=fullscreen_bytes,
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"PDF generation failed: {str(e)}"})

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=biodata.pdf"}
    )
