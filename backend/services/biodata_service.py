import io
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import mm
from typing import Optional


# ── Template color palettes ──────────────────────────────────────────────
TEMPLATES = {
    1:  {"primary": "#7C3AED", "secondary": "#F59E0B", "accent": "#3B82F6", "style": "modern"},
    2:  {"primary": "#16A34A", "secondary": "#15803D", "accent": "#FDE047", "style": "modern"},
    3:  {"primary": "#0F766E", "secondary": "#0D9488", "accent": "#F59E0B", "style": "modern"},
    4:  {"primary": "#1E293B", "secondary": "#475569", "accent": "#94A3B8", "style": "minimal"},
    5:  {"primary": "#EA580C", "secondary": "#C2410C", "accent": "#FCD34D", "style": "modern"},
    6:  {"primary": "#BE123C", "secondary": "#9F1239", "accent": "#FB7185", "style": "modern"},
    7:  {"primary": "#D97706", "secondary": "#B45309", "accent": "#FDE68A", "style": "traditional", "border": "#D97706"},
    8:  {"primary": "#DB2777", "secondary": "#BE185D", "accent": "#FBCFE8", "style": "traditional", "border": "#DB2777"},
    9:  {"primary": "#92400E", "secondary": "#78350F", "accent": "#FDE68A", "style": "traditional", "border": "#B45309"},
    10: {"primary": "#EA580C", "secondary": "#C2410C", "accent": "#FED7AA", "style": "traditional", "border": "#EA580C"},
    11: {"primary": "#2563EB", "secondary": "#1D4ED8", "accent": "#BFDBFE", "style": "traditional_dashed", "border": "#2563EB"},
    12: {"primary": "#111827", "secondary": "#374151", "accent": "#D1D5DB", "style": "traditional", "border": "#111827"},
}


class BiodataService:

    @staticmethod
    def generate_biodata(
        template_id: int = 1,
        # Personal
        header_left: str = "",
        header_right: str = "",
        name: str = "",
        dob: str = "",
        tob: str = "",
        pob: str = "",
        gotra: str = "",
        hobbies: str = "",
        complexion: str = "",
        height: str = "",
        religion_caste: str = "",
        education: str = "",
        occupation: str = "",
        # Family
        grandfather_name: str = "",
        grandfather_occupation: str = "",
        grandmother_name: str = "",
        grandmother_occupation: str = "",
        father_name: str = "",
        father_occupation: str = "",
        mother_name: str = "",
        mother_occupation: str = "",
        # Contact
        contact_number: str = "",
        address: str = "",
        email: str = "",
        # Photos
        profile_photo_bytes: Optional[bytes] = None,
        fullscreen_photo_bytes: Optional[bytes] = None,
    ) -> bytes:
        t = TEMPLATES.get(template_id, TEMPLATES[1])
        PRIMARY   = HexColor(t["primary"])
        SECONDARY = HexColor(t["secondary"])
        ACCENT    = HexColor(t["accent"])
        BORDER_C  = HexColor(t.get("border", t["primary"]))
        style     = t["style"]

        buffer = io.BytesIO()
        W, H = A4
        c = canvas.Canvas(buffer, pagesize=A4)

        DARK     = HexColor("#0F172A")
        MUTED    = HexColor("#64748B")
        LIGHT_BG = HexColor("#F8FAFC")
        WHITE    = white
        BORDER   = HexColor("#E2E8F0")

        margin    = 15 * mm
        content_w = W - 2 * margin

        # ── Common helper functions ──────────────────────────────

        def draw_field_narrow(cy, label, value, cw=None):
            _cw = cw or content_w
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 7.5)
            c.drawString(margin, cy + 1 * mm, label)
            c.setFillColor(DARK)
            c.setFont("Helvetica-Bold", 9)
            c.drawString(margin + 36 * mm, cy + 1 * mm, value or "—")
            c.setStrokeColor(BORDER)
            c.setLineWidth(0.4)
            c.line(margin, cy - 1 * mm, margin + _cw, cy - 1 * mm)
            return cy - 7 * mm

        def draw_field_pair(cy, label1, val1, label2, val2):
            half = content_w / 2 - 3 * mm
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 7.5)
            c.drawString(margin, cy + 1 * mm, label1)
            c.setFillColor(DARK)
            c.setFont("Helvetica-Bold", 9)
            c.drawString(margin + 36 * mm, cy + 1 * mm, val1 or "—")
            c.setStrokeColor(BORDER)
            c.setLineWidth(0.4)
            c.line(margin, cy - 1 * mm, margin + half, cy - 1 * mm)
            rx = margin + half + 6 * mm
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 7.5)
            c.drawString(rx, cy + 1 * mm, label2)
            c.setFillColor(DARK)
            c.setFont("Helvetica-Bold", 9)
            c.drawString(rx + 36 * mm, cy + 1 * mm, val2 or "—")
            c.setStrokeColor(BORDER)
            c.line(rx, cy - 1 * mm, margin + content_w, cy - 1 * mm)
            return cy - 7 * mm

        def draw_section_header_band(cy, text):
            """Colored full-width band (modern templates)."""
            c.setFillColor(PRIMARY)
            c.rect(margin, cy - 4 * mm, content_w, 7.5 * mm, fill=1, stroke=0)
            c.setFillColor(WHITE)
            c.setFont("Helvetica-Bold", 9.5)
            c.drawString(margin + 4 * mm, cy - 0.5 * mm, text)
            return cy - 10 * mm

        def draw_section_header_line(cy, text):
            """Left-border colored line (traditional templates)."""
            c.setFillColor(PRIMARY)
            c.rect(margin, cy - 4 * mm, 2.5 * mm, 7 * mm, fill=1, stroke=0)
            c.setFillColor(PRIMARY)
            c.setFont("Helvetica-Bold", 9.5)
            c.drawString(margin + 5 * mm, cy - 0.5 * mm, text)
            # thin accent underline
            c.setStrokeColor(ACCENT)
            c.setLineWidth(0.8)
            c.line(margin, cy - 4 * mm, margin + content_w, cy - 4 * mm)
            return cy - 10 * mm

        draw_section_header = draw_section_header_band if "traditional" not in style else draw_section_header_line

        # ── Draw background & border ────────────────────────────
        c.setFillColor(WHITE)
        c.rect(0, 0, W, H, fill=1, stroke=0)

        if "traditional" in style:
            # Decorative border
            bw = 6
            c.setStrokeColor(BORDER_C)
            c.setLineWidth(bw)
            if "dashed" in style:
                c.setDash(8, 5)
            c.rect(5 * mm, 5 * mm, W - 10 * mm, H - 10 * mm, fill=0, stroke=1)
            c.setDash()
            # Inner thin border
            c.setLineWidth(1)
            c.setStrokeColor(HexColor(t.get("accent", "#D1D5DB")))
            c.rect(7 * mm, 7 * mm, W - 14 * mm, H - 14 * mm, fill=0, stroke=1)

        # ── HEADER ──────────────────────────────────────────────
        if "traditional" in style:
            # Traditional: Om/icon top center + name below
            y = H - 14 * mm
            c.setFillColor(PRIMARY)
            c.setFont("Helvetica-Bold", 22)
            c.drawCentredString(W / 2, y, "\u0950")  # Om symbol
            y -= 7 * mm
            c.setFont("Helvetica-Bold", 14)
            c.drawCentredString(W / 2, y, header_right or "Bio Data")
            y -= 5 * mm
            # Accent divider
            c.setStrokeColor(PRIMARY)
            c.setLineWidth(1.5)
            c.line(margin + 20 * mm, y, W - margin - 20 * mm, y)
            y -= 8 * mm
        else:
            # Modern: colored header band
            c.setFillColor(PRIMARY)
            c.rect(0, H - 26 * mm, W, 26 * mm, fill=1, stroke=0)
            c.setFillColor(WHITE)
            c.setFont("Helvetica-Bold", 9)
            c.drawString(margin, H - 9 * mm, header_left or "|| Shree Ganesh ||")
            c.setFont("Helvetica-Bold", 16)
            c.drawCentredString(W / 2, H - 17 * mm, header_right or "Bio Data")
            # Gold accent line
            c.setStrokeColor(ACCENT)
            c.setLineWidth(2)
            c.line(margin, H - 27 * mm, W - margin, H - 27 * mm)
            y = H - 34 * mm

        # ── Profile photo ────────────────────────────────────────
        photo_x     = W - margin - 33 * mm
        photo_y_top = y
        photo_w     = 31 * mm
        photo_h     = 38 * mm

        if profile_photo_bytes:
            try:
                img = Image.open(io.BytesIO(profile_photo_bytes))
                img_io = io.BytesIO()
                img.convert("RGB").save(img_io, format="JPEG", quality=90)
                img_io.seek(0)
                from reportlab.lib.utils import ImageReader
                img_reader = ImageReader(img_io)
                c.setStrokeColor(PRIMARY)
                c.setLineWidth(1.5)
                c.rect(photo_x, photo_y_top - photo_h, photo_w, photo_h, fill=0, stroke=1)
                c.drawImage(img_reader, photo_x + 1, photo_y_top - photo_h + 1,
                            photo_w - 2, photo_h - 2, preserveAspectRatio=True, mask='auto')
            except Exception:
                pass
        else:
            c.setStrokeColor(PRIMARY)
            c.setFillColor(HexColor(t["accent"] + "44") if len(t["accent"]) == 7 else LIGHT_BG)
            c.rect(photo_x, photo_y_top - photo_h, photo_w, photo_h, fill=1, stroke=1)
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 7)
            c.drawCentredString(photo_x + photo_w / 2, photo_y_top - photo_h / 2, "Photo")

        narrow_cw = content_w - photo_w - 8 * mm

        # ── PERSONAL DETAILS ─────────────────────────────────────
        y = draw_section_header(y, "Personal Details")

        for lbl, val in [
            ("Name:", name), ("Date of Birth:", dob),
            ("Time of Birth:", tob), ("Place of Birth:", pob),
            ("Gotra:", gotra), ("Hobbies:", hobbies),
        ]:
            y = draw_field_narrow(y, lbl, val, cw=narrow_cw)

        # push y below photo if needed
        photo_bottom = photo_y_top - photo_h - 2 * mm
        if y > photo_bottom:
            y = photo_bottom
        y -= 2 * mm

        y = draw_field_pair(y, "Complexion:", complexion, "Height:", height)
        y = draw_field_pair(y, "Religion/Caste:", religion_caste, "Education:", education)
        y = draw_field_narrow(y, "Job/Occupation:", occupation)
        y -= 4 * mm

        # ── FAMILY DETAILS ───────────────────────────────────────
        y = draw_section_header(y, "Family Details")
        y = draw_field_pair(y, "Grandfather's Name:", grandfather_name, "Occ.:", grandfather_occupation)
        y = draw_field_pair(y, "Grandmother's Name:", grandmother_name, "Occ.:", grandmother_occupation)
        y = draw_field_pair(y, "Father's Name:", father_name, "Occ.:", father_occupation)
        y = draw_field_pair(y, "Mother's Name:", mother_name, "Occ.:", mother_occupation)
        y -= 4 * mm

        # ── CONTACT DETAILS ──────────────────────────────────────
        y = draw_section_header(y, "Contact Details")
        y = draw_field_narrow(y, "Contact Number:", contact_number)
        y = draw_field_narrow(y, "Email ID:", email)
        y = draw_field_narrow(y, "Address:", address)
        y -= 4 * mm

        # ── FOOTER ───────────────────────────────────────────────
        c.setFillColor(LIGHT_BG)
        c.rect(0, 0, W, 10 * mm, fill=1, stroke=0)
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.5)
        c.line(0, 10 * mm, W, 10 * mm)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7)
        c.drawCentredString(W / 2, 4 * mm, "Generated with Bharat Job Result tool")

        c.showPage()

        # ── PAGE 2: Full screen photo ─────────────────────────────
        if fullscreen_photo_bytes:
            try:
                img2 = Image.open(io.BytesIO(fullscreen_photo_bytes))
                img2_io = io.BytesIO()
                img2.convert("RGB").save(img2_io, format="JPEG", quality=92)
                img2_io.seek(0)
                from reportlab.lib.utils import ImageReader
                reader2 = ImageReader(img2_io)
                pad = 10 * mm
                c.setFillColor(DARK)
                c.rect(0, 0, W, H, fill=1, stroke=0)
                c.drawImage(reader2, pad, pad, W - 2 * pad, H - 2 * pad,
                            preserveAspectRatio=True, mask='auto')
                c.showPage()
            except Exception:
                pass

        c.save()
        buffer.seek(0)
        return buffer.read()
