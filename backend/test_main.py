import io
import json
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from main import app

client = TestClient(app)

def create_dummy_image(format='JPEG', size=(100, 100)):
    buf = io.BytesIO()
    img = Image.new('RGB', size, color='red')
    img.save(buf, format=format)
    return buf.getvalue()

def create_dummy_pdf():
    # Make a simple 1-page PDF using img2pdf or similar
    from services.pdf_service import PdfService
    img_bytes = create_dummy_image()
    return PdfService.images_to_pdf([img_bytes])

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["message"] == "Welcome to Bharat Job Result Tool API"

def test_age_calculator():
    response = client.post("/api/utility/age-calculator", json={"dob": "2000-01-01", "as_of_date": "2026-07-05"})
    assert response.status_code == 200
    data = response.json()
    assert data["years"] == 26

def test_presets():
    response = client.get("/api/form/presets")
    assert response.status_code == 200
    assert "nsdl-pan" in response.json()

def test_resume():
    payload = {
        "name": "Test User",
        "objective": "Objective text",
        "skills": ["Python"]
    }
    response = client.post("/api/utility/resume", json=payload)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"

def test_image_resize():
    img_bytes = create_dummy_image()
    files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
    data = {"width": 50, "height": 50, "maintain_aspect": "false"}
    response = client.post("/api/image/resize", files=files, data=data)
    assert response.status_code == 200
    # Verify dimensions of output
    img = Image.open(io.BytesIO(response.content))
    assert img.size == (50, 50)

def test_image_compress():
    img_bytes = create_dummy_image(size=(500, 500))
    files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
    data = {"target_kb": 10}
    response = client.post("/api/image/compress-to-kb", files=files, data=data)
    assert response.status_code == 200
    assert len(response.content) <= 10 * 1024

def test_image_convert():
    img_bytes = create_dummy_image(format='PNG')
    files = {"file": ("test.png", img_bytes, "image/png")}
    data = {"target_format": "jpeg"}
    response = client.post("/api/image/convert-format", files=files, data=data)
    assert response.status_code == 200
    img = Image.open(io.BytesIO(response.content))
    assert img.format == "JPEG"

def test_image_dpi():
    img_bytes = create_dummy_image()
    files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
    data = {"dpi": 150}
    response = client.post("/api/image/dpi", files=files, data=data)
    assert response.status_code == 200
    img = Image.open(io.BytesIO(response.content))
    assert img.info.get("dpi") == (150, 150)

def test_image_filter():
    img_bytes = create_dummy_image()
    files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
    data = {"filter_type": "sepia"}
    response = client.post("/api/image/filter", files=files, data=data)
    assert response.status_code == 200

def test_image_remove_bg():
    img_bytes = create_dummy_image()
    files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
    response = client.post("/api/image/remove-bg", files=files)
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"

def test_passport_photo():
    img_bytes = create_dummy_image(size=(300, 400))
    files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
    response = client.post("/api/image/passport-photo", files=files, data={"min_kb": 10, "max_kb": 30})
    assert response.status_code == 200
    img = Image.open(io.BytesIO(response.content))
    assert img.size == (413, 531)

def test_signature_resizer():
    img_bytes = create_dummy_image()
    files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
    response = client.post("/api/image/signature-resizer", files=files, data={"min_kb": 5, "max_kb": 15})
    assert response.status_code == 200
    img = Image.open(io.BytesIO(response.content))
    assert img.size == (140, 60)

def test_add_name_date():
    img_bytes = create_dummy_image()
    files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
    data = {"name": "RAM KUMAR", "date_str": "2026-07-05", "position": "bottom", "font_size": 18}
    response = client.post("/api/image/add-name-date", files=files, data=data)
    assert response.status_code == 200

def test_join_photo_signature():
    photo_bytes = create_dummy_image(size=(150, 150))
    sig_bytes = create_dummy_image(size=(100, 50))
    files = {
        "photo": ("photo.jpg", photo_bytes, "image/jpeg"),
        "signature": ("sig.jpg", sig_bytes, "image/jpeg")
    }
    response = client.post("/api/image/join-photo-signature", files=files)
    assert response.status_code == 200
    img = Image.open(io.BytesIO(response.content))
    # Joined width matches photo width (150). Photo height = 150.
    # Sig aspect ratio was 100x50 (2:1). Resized to width 150 -> height 75.
    # Total combined height = 150 + 75 = 225.
    assert img.size == (150, 225)

def test_form_resize():
    img_bytes = create_dummy_image()
    files = {"file": ("photo.jpg", img_bytes, "image/jpeg")}
    # Test RRB Photo resize (spec: 3.5x4.5cm -> pixels approx 413x531 @ 300 DPI)
    response = client.post("/api/form/rrb/photo-resize", files=files)
    assert response.status_code == 200
    img = Image.open(io.BytesIO(response.content))
    assert img.size == (413, 531)

def test_pdf_image_to_pdf():
    img_bytes = create_dummy_image()
    files = [
        ("files", ("img1.jpg", img_bytes, "image/jpeg")),
        ("files", ("img2.jpg", img_bytes, "image/jpeg"))
    ]
    response = client.post("/api/pdf/image-to-pdf", files=files)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"

def test_pdf_to_jpg():
    pdf_bytes = create_dummy_pdf()
    files = {"file": ("doc.pdf", pdf_bytes, "application/pdf")}
    response = client.post("/api/pdf/pdf-to-jpg", files=files)
    assert response.status_code == 200
    assert response.headers["content-type"] in ["application/zip", "image/png", "image/jpeg"]

def test_pdf_merge():
    pdf1 = create_dummy_pdf()
    pdf2 = create_dummy_pdf()
    files = [
        ("files", ("pdf1.pdf", pdf1, "application/pdf")),
        ("files", ("pdf2.pdf", pdf2, "application/pdf"))
    ]
    response = client.post("/api/pdf/merge", files=files)
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"

def test_pdf_split():
    pdf = create_dummy_pdf()
    files = {"file": ("doc.pdf", pdf, "application/pdf")}
    response = client.post("/api/pdf/split", files=files, data={"page_ranges": "1"})
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"

def test_pdf_rotate():
    pdf = create_dummy_pdf()
    files = {"file": ("doc.pdf", pdf, "application/pdf")}
    response = client.post("/api/pdf/rotate", files=files, data={"angle": 90})
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"

def test_insta_profile():
    img_bytes = create_dummy_image()
    files = {"file": ("test.jpg", img_bytes, "image/jpeg")}
    response = client.post("/api/image/insta-profile", files=files, data={"border_color": "gradient"})
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"

def test_pdf_page_thumbnails():
    pdf = create_dummy_pdf()
    files = {"file": ("doc.pdf", pdf, "application/pdf")}
    response = client.post("/api/pdf/page-thumbnails", files=files)
    assert response.status_code == 200
    assert "thumbnails" in response.json()
    assert len(response.json()["thumbnails"]) > 0

def test_pdf_apply_edits():
    pdf = create_dummy_pdf()
    files = {"file": ("doc.pdf", pdf, "application/pdf")}
    edits = [
        {"type": "text", "page": 0, "x": 0.1, "y": 0.1, "width": 0.4, "height": 0.05, "text": "Hello PDF World", "font_size": 14, "color": "#000000", "is_bold": True},
        {"type": "whiteout", "page": 0, "x": 0.2, "y": 0.2, "width": 0.2, "height": 0.05},
        {"type": "shape", "page": 0, "x": 0.3, "y": 0.3, "width": 0.2, "height": 0.1, "shape_type": "rectangle", "border_color": "#FF0000", "fill_color": "#00FF00"},
        {"type": "highlight", "page": 0, "x": 0.1, "y": 0.5, "width": 0.4, "height": 0.03, "highlight_color": "#FFEB3B"},
        {"type": "freehand", "page": 0, "x": 0, "y": 0, "width": 1, "height": 1, "path_data": "M 0.1 0.1 L 0.2 0.2 L 0.3 0.1", "stroke_color": "#0000FF"}
    ]
    response = client.post("/api/pdf/apply-edits", files=files, data={"edits_json": json.dumps(edits)})
    if response.status_code != 200:
        print(response.json())
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"

