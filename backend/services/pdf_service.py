import io
import img2pdf
from PIL import Image
from pypdf import PdfReader, PdfWriter
from typing import List
import base64
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor


class PdfService:
    @staticmethod
    def images_to_pdf(image_bytes_list: List[bytes], page_size: str = "A4", orientation: str = "Portrait", margin: float = 10.0) -> bytes:
        """Convert one or more images to a single PDF using img2pdf with custom layout settings."""
        # img2pdf needs JPEG/PNG bytes, convert all to JPEG first
        jpeg_list = []
        for img_bytes in image_bytes_list:
            img = Image.open(io.BytesIO(img_bytes))
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            buf = io.BytesIO()
            img.save(buf, format='JPEG', quality=95)
            jpeg_list.append(buf.getvalue())

        try:
            # Define page sizes in points (A4, A5, Letter)
            PAGE_SIZES = {
                "a4": (595.27, 841.89),
                "a5": (419.53, 595.27),
                "letter": (612.0, 792.0)
            }
            pw, ph = PAGE_SIZES.get(page_size.lower(), PAGE_SIZES["a4"])
            
            # Handle orientation
            if orientation.lower() == "landscape":
                pw, ph = ph, pw
                
            # Convert margin from mm to points (1 mm = 72 / 25.4 points)
            margin_pt = margin * 72 / 25.4
            
            # Get the layout function with border padding
            layout_fun = img2pdf.get_layout_fun(pagesize=(pw, ph), border=margin_pt)
            pdf_bytes = img2pdf.convert(jpeg_list, layout_fun=layout_fun)
        except Exception as e:
            # Fallback to simple conversion if layout parse fails
            print(f"PDF custom layout parsing failed, falling back. Error: {e}")
            pdf_bytes = img2pdf.convert(jpeg_list)

        return pdf_bytes

    @staticmethod
    def pdf_to_images(pdf_bytes: bytes, fmt: str = "png", dpi: int = 150) -> List[bytes]:
        """Convert PDF pages to custom format images (PNG, JPG, WEBP, GIF) using PyMuPDF (fitz)."""
        import fitz
        from PIL import Image
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            result = []
            zoom = dpi / 72.0
            matrix = fitz.Matrix(zoom, zoom)
            clean_fmt = fmt.lower()
            fitz_fmt = "png" if clean_fmt == "png" else "jpg"
            for page in doc:
                pix = page.get_pixmap(matrix=matrix)
                raw_bytes = pix.tobytes(fitz_fmt)
                if clean_fmt in ("webp", "gif"):
                    pil_img = Image.open(io.BytesIO(raw_bytes))
                    buf = io.BytesIO()
                    pil_img.save(buf, format=clean_fmt.upper())
                    result.append(buf.getvalue())
                else:
                    result.append(raw_bytes)
            return result
        except Exception as e:
            raise RuntimeError(f"PDF to image conversion failed. Error: {e}")

    @staticmethod
    def merge_pdfs(pdf_bytes_list: List[bytes]) -> bytes:
        """Merge multiple PDFs into one."""
        writer = PdfWriter()
        for pdf_bytes in pdf_bytes_list:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            for page in reader.pages:
                writer.add_page(page)
        output = io.BytesIO()
        writer.write(output)
        return output.getvalue()

    @staticmethod
    def split_pdf(pdf_bytes: bytes, page_ranges: str) -> List[bytes]:
        """Split PDF by page ranges. E.g., '1-3,5,7-9'"""
        reader = PdfReader(io.BytesIO(pdf_bytes))
        total_pages = len(reader.pages)
        results = []

        ranges = page_ranges.split(',')
        for r in ranges:
            r = r.strip()
            writer = PdfWriter()
            if '-' in r:
                try:
                    start, end = r.split('-')
                    start, end = int(start) - 1, int(end)
                except ValueError:
                    continue
                for i in range(max(0, start), min(end, total_pages)):
                    writer.add_page(reader.pages[i])
            else:
                try:
                    idx = int(r) - 1
                except ValueError:
                    continue
                if 0 <= idx < total_pages:
                    writer.add_page(reader.pages[idx])
            
            if len(writer.pages) == 0:
                continue

            output = io.BytesIO()
            writer.write(output)
            results.append(output.getvalue())

        if not results:
            raise ValueError("No matching pages found for the specified range.")

        return results

    @staticmethod
    def rotate_pdf(pdf_bytes: bytes, angle: int) -> bytes:
        """Rotate all pages of a PDF by given angle (90, 180, 270)."""
        reader = PdfReader(io.BytesIO(pdf_bytes))
        writer = PdfWriter()
        for page in reader.pages:
            page.rotate(angle)
            writer.add_page(page)
        output = io.BytesIO()
        writer.write(output)
        return output.getvalue()

    @staticmethod
    def extract_text_elements(pdf_bytes: bytes) -> List[dict]:
        """Extract existing text spans with their coordinates, font sizing, and coloring using PyMuPDF."""
        import fitz
        elements = []
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                width = float(page.rect.width)
                height = float(page.rect.height)
                
                text_dict = page.get_text("dict")
                for block_idx, block in enumerate(text_dict.get("blocks", [])):
                    if block.get("type") != 0:  # 0 is text block
                        continue
                    for line_idx, line in enumerate(block.get("lines", [])):
                        for span_idx, span in enumerate(line.get("spans", [])):
                            text = span.get("text", "").strip()
                            if not text:
                                continue
                            
                            bbox = span.get("bbox")  # (x0, y0, x1, y1)
                            if not bbox or len(bbox) < 4:
                                continue
                                
                            x0, y0, x1, y1 = bbox
                            
                            # Normalize coordinates to range 0-1
                            nx = x0 / width
                            ny = y0 / height
                            nw = (x1 - x0) / width
                            nh = (y1 - y0) / height
                            
                            # Parse font family
                            font_name = span.get("font", "Helvetica")
                            if "helvetica" in font_name.lower() or "arial" in font_name.lower():
                                family = "Helvetica"
                            elif "courier" in font_name.lower() or "mono" in font_name.lower():
                                family = "Courier"
                            elif "times" in font_name.lower() or "roman" in font_name.lower() or "serif" in font_name.lower():
                                family = "Times"
                            else:
                                family = "Helvetica"
                                
                            # Convert integer color to hex
                            color_val = span.get("color", 0)
                            r = (color_val >> 16) & 255
                            g = (color_val >> 8) & 255
                            b = color_val & 255
                            hex_color = f"#{r:02x}{g:02x}{b:02x}"
                            
                            elements.append({
                                "id": f"orig_{page_idx}_{block_idx}_{line_idx}_{span_idx}",
                                "type": "text",
                                "is_existing": True,
                                "page": page_idx,
                                "x": round(nx, 4),
                                "y": round(ny, 4),
                                "width": round(nw, 4),
                                "height": round(nh, 4),
                                "orig_x": round(nx, 4),
                                "orig_y": round(ny, 4),
                                "orig_width": round(nw, 4),
                                "orig_height": round(nh, 4),
                                "text": text,
                                "original_text": text,
                                "font_size": round(span.get("size", 10), 1),
                                "font_family": family,
                                "color": hex_color,
                                "is_bold": "bold" in font_name.lower(),
                                "is_italic": "italic" in font_name.lower() or "oblique" in font_name.lower()
                            })
        except Exception as e:
            print(f"Failed to extract text elements: {e}")
        return elements

    @staticmethod
    def apply_edits(pdf_bytes: bytes, edits: List[dict]) -> bytes:
        """Apply visual overlays and redacts (text, whiteouts, signature images, shapes, highlights, freehand) to PDF pages using PyMuPDF."""
        import fitz
        import base64
        import io
        from models.schemas import PdfElement

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        # Convert edits to PdfElement objects if they are dicts
        parsed_edits: List[PdfElement] = []
        for edit in edits:
            if isinstance(edit, dict):
                parsed_edits.append(PdfElement(**edit))
            else:
                parsed_edits.append(edit)

        # Group edits by page index
        edits_by_page = {}
        for edit in parsed_edits:
            p_idx = int(edit.page)
            if p_idx not in edits_by_page:
                edits_by_page[p_idx] = []
            edits_by_page[p_idx].append(edit)

        # Helper to convert hex color to RGB tuple (0.0 to 1.0)
        def hex_to_rgb(hex_str):
            if not hex_str or not hex_str.startswith("#"):
                return (0, 0, 0)
            try:
                hex_str = hex_str.lstrip("#")
                if len(hex_str) == 3:
                    hex_str = "".join([c*2 for c in hex_str])
                r = int(hex_str[0:2], 16) / 255.0
                g = int(hex_str[2:4], 16) / 255.0
                b = int(hex_str[4:6], 16) / 255.0
                return (r, g, b)
            except Exception:
                return (0, 0, 0)

        # Helper to wrap text within a maximum width in points using PyMuPDF measurements
        def wrap_text(text: str, font_name: str, font_size: float, max_width_pt: float) -> List[str]:
            import fitz
            paragraphs = text.split("\n")
            wrapped_lines = []
            for para in paragraphs:
                if not para.strip():
                    wrapped_lines.append("")
                    continue
                words = para.split(" ")
                current_line = []
                for word in words:
                    test_line = " ".join(current_line + [word])
                    try:
                        line_len = fitz.get_text_length(test_line, fontname=font_name, fontsize=font_size)
                    except Exception:
                        line_len = len(test_line) * font_size * 0.5
                    
                    if line_len <= max_width_pt:
                        current_line.append(word)
                    else:
                        if current_line:
                            wrapped_lines.append(" ".join(current_line))
                            current_line = [word]
                        else:
                            wrapped_lines.append(word)
                            current_line = []
                if current_line:
                    wrapped_lines.append(" ".join(current_line))
            return wrapped_lines

        for page_idx in range(len(doc)):
            page = doc[page_idx]
            width = float(page.rect.width)
            height = float(page.rect.height)

            if page_idx in edits_by_page:
                # First pass: Apply redactions (so they delete text content cleanly)
                redact_applied = False
                for edit in edits_by_page[page_idx]:
                    if edit.type == "text" and edit.is_existing:
                        # Check if the element was moved or edited
                        is_moved = (edit.orig_x is not None and edit.orig_y is not None) and (
                            abs(edit.x - edit.orig_x) > 1e-4 or abs(edit.y - edit.orig_y) > 1e-4
                        )
                        is_edited = edit.text != edit.original_text
                        if not is_moved and not is_edited:
                            continue
                        
                        ox = edit.orig_x if edit.orig_x is not None else edit.x
                        oy = edit.orig_y if edit.orig_y is not None else edit.y
                        ow = edit.orig_width if edit.orig_width is not None else edit.width
                        oh = edit.orig_height if edit.orig_height is not None else edit.height
                        
                        rx0 = ox * width
                        ry0 = oy * height
                        rx1 = (ox + ow) * width
                        ry1 = (oy + oh) * height

                        rect = fitz.Rect(rx0, ry0, rx1, ry1)
                        # Add a redact annotation with white fill to erase original text
                        page.add_redact_annot(rect, fill=(1, 1, 1))
                        redact_applied = True
                        
                    elif edit.type == "whiteout":
                        rx0 = edit.x * width
                        ry0 = edit.y * height
                        rx1 = (edit.x + edit.width) * width
                        ry1 = (edit.y + edit.height) * height

                        rect = fitz.Rect(rx0, ry0, rx1, ry1)
                        # Add a redact annotation with white fill to securely erase content
                        page.add_redact_annot(rect, fill=(1, 1, 1))
                        redact_applied = True

                if redact_applied:
                    page.apply_redactions()

                # Second pass: Draw other overlays (new text, shapes, highlights, images, signatures)
                for edit in edits_by_page[page_idx]:
                    etype = edit.type

                    # Get coordinates
                    rx0 = edit.x * width
                    ry0 = edit.y * height
                    rx1 = (edit.x + edit.width) * width
                    ry1 = (edit.y + edit.height) * height
                    rect = fitz.Rect(rx0, ry0, rx1, ry1)

                    if etype == "whiteout":
                        # Draw a solid white rectangle to visually cover other elements in z-order
                        page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1), width=0)

                    elif etype == "text":
                        # Check if it was an unchanged existing element
                        is_moved = (edit.orig_x is not None and edit.orig_y is not None) and (
                            abs(edit.x - edit.orig_x) > 1e-4 or abs(edit.y - edit.orig_y) > 1e-4
                        )
                        is_edited = edit.text != edit.original_text
                        if edit.is_existing and not is_moved and not is_edited:
                            continue

                        text_str = edit.text or ""
                        font_size = float(edit.font_size or 12)
                        color_rgb = hex_to_rgb(edit.color or "#000000")
                        is_bold = edit.is_bold or False
                        is_italic = edit.is_italic or False
                        font_family = edit.font_family or "Helvetica"

                        # Map font family to PyMuPDF font names
                        font_map = {
                            "Helvetica": {
                                "normal": "helv",
                                "bold": "hebo",
                                "italic": "heob",
                                "bolditalic": "hebi",
                            },
                            "Courier": {
                                "normal": "cour",
                                "bold": "cobo",
                                "italic": "coob",
                                "bolditalic": "cobi",
                            },
                            "Times": {
                                "normal": "tiro",
                                "bold": "tibo",
                                "italic": "tiit",
                                "bolditalic": "tibi",
                            },
                        }
                        family_fonts = font_map.get(font_family, font_map["Helvetica"])
                        if is_bold and is_italic:
                            font_name = family_fonts["bolditalic"]
                        elif is_bold:
                            font_name = family_fonts["bold"]
                        elif is_italic:
                            font_name = family_fonts["italic"]
                        else:
                            font_name = family_fonts["normal"]

                        # Wrap text to fit the bounding box width
                        wrapped_lines = wrap_text(text_str, font_name, font_size, max(1.0, rx1 - rx0))
                        line_height = font_size * 1.2
                        
                        # Apply y-offset baseline logic (using edit.height * 0.8 for single line)
                        base_y = ry0 + (edit.height * height * 0.8) if len(wrapped_lines) == 1 else ry0 + font_size
                        for i, line in enumerate(wrapped_lines):
                            text_y = base_y + (i * line_height)
                            page.insert_text(fitz.Point(rx0, text_y), line, fontsize=font_size, fontname=font_name, color=color_rgb)

                    elif etype in ("image", "signature"):
                        image_data = edit.image_data or ""
                        if image_data.startswith("data:"):
                            try:
                                header, base64_str = image_data.split(",", 1)
                            except ValueError:
                                base64_str = image_data
                        else:
                            base64_str = image_data

                        if base64_str:
                            try:
                                img_bytes = base64.b64decode(base64_str)
                                page.insert_image(rect, stream=img_bytes)
                            except Exception as img_err:
                                print(f"Failed to draw overlay image: {img_err}")

                    elif etype == "shape":
                        shape_type = edit.shape_type or "rectangle"
                        border_color = hex_to_rgb(edit.border_color or "#000000")
                        fill_color_str = edit.fill_color or "transparent"
                        fill_color = None if fill_color_str == "transparent" else hex_to_rgb(fill_color_str)
                        border_width = float(edit.border_width or 2)

                        if shape_type == "rectangle":
                            page.draw_rect(rect, color=border_color, fill=fill_color, width=border_width)
                        elif shape_type == "ellipse":
                            page.draw_oval(rect, color=border_color, fill=fill_color, width=border_width)
                        elif shape_type == "line":
                            page.draw_line(rect.bl, rect.tr, color=border_color, width=border_width)

                    elif etype == "highlight":
                        hl_color = hex_to_rgb(edit.highlight_color or "#FFEB3B")
                        shape = page.new_shape()
                        shape.draw_rect(rect)
                        shape.finish(color=hl_color, fill=hl_color, width=0, fill_opacity=0.35)
                        shape.commit()

                    elif etype == "freehand":
                        path_data = edit.path_data or ""
                        stroke_color = hex_to_rgb(edit.stroke_color or "#000000")
                        stroke_width = float(edit.stroke_width or 2)

                        shape = page.new_shape()
                        tokens = path_data.strip().split()
                        i = 0
                        has_path = False
                        polylines = []
                        current_line = []
                        while i < len(tokens):
                            cmd = tokens[i]
                            if (cmd == 'M' or cmd == 'L') and i + 2 < len(tokens):
                                try:
                                    px = float(tokens[i + 1]) * width
                                    py = float(tokens[i + 2]) * height
                                    curr_point = fitz.Point(px, py)
                                    if cmd == 'M':
                                        if current_line:
                                            polylines.append(current_line)
                                        current_line = [curr_point]
                                    elif cmd == 'L':
                                        current_line.append(curr_point)
                                        has_path = True
                                    i += 3
                                except (ValueError, IndexError):
                                    i += 1
                            else:
                                i += 1
                        if current_line:
                            polylines.append(current_line)
                            
                        for line in polylines:
                            if len(line) > 1:
                                shape.draw_polyline(line)
                        if has_path:
                            shape.finish(color=stroke_color, width=stroke_width, lineCap=1, lineJoin=1)
                            shape.commit()

        output = io.BytesIO()
        doc.save(output)
        doc.close()
        return output.getvalue()

    @staticmethod
    def compress_pdf(pdf_bytes: bytes, target_kb: int) -> bytes:
        """Compress PDF to a target size (100KB, 200KB, etc.) by downscaling pages and compressing JPEG quality."""
        import fitz
        import io
        from PIL import Image
        import img2pdf
        from pypdf import PdfReader

        # 1. Try lossless metadata compression first to preserve text selection and high quality
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            output = io.BytesIO()
            doc.save(output, garbage=4, deflate=True, clean=True)
            compressed_bytes = output.getvalue()
            doc.close()
            if len(compressed_bytes) <= target_kb * 1024:
                return compressed_bytes
        except Exception:
            pass

        # 2. Fallback to rasterized page compression if target KB cannot be met losslessly
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            page_count = len(reader.pages)
        except Exception:
            page_count = 1

        if page_count == 0:
            page_count = 1

        # Heuristic target KB per page
        target_kb_per_page = target_kb / page_count

        # Resolve quality and DPI from target size per page
        if target_kb_per_page < 40:
            dpi = 90
            quality = 20
        elif target_kb_per_page < 70:
            dpi = 110
            quality = 35
        elif target_kb_per_page < 100:
            dpi = 130
            quality = 50
        elif target_kb_per_page < 150:
            dpi = 150
            quality = 65
        else:
            dpi = 180
            quality = 80

        # Render pages to images using fitz
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            compressed_images = []
            zoom = dpi / 72.0
            matrix = fitz.Matrix(zoom, zoom)
            for page in doc:
                pix = page.get_pixmap(matrix=matrix)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                img_io = io.BytesIO()
                rgb_page = img.convert("RGB")
                rgb_page.save(img_io, format="JPEG", quality=quality, optimize=True)
                compressed_images.append(img_io.getvalue())
        except Exception as e:
            raise RuntimeError(f"Failed to render/compress PDF pages: {str(e)}")

        # Join back to single PDF
        try:
            result_pdf = img2pdf.convert(compressed_images)
            return result_pdf
        except Exception as e:
            raise RuntimeError(f"Failed to rebuild PDF: {str(e)}")
