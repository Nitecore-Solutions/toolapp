import io
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw, ImageFont
from typing import Optional

class ImageService:
    @staticmethod
    def overlay_cloth_advanced(base_image_bytes: bytes, cloth_url: str, cloth_bytes: Optional[bytes], pw: float, ph: float, px: float, py: float, cw: float, ch: float, cx: float, cy: float, cloth_id: Optional[str] = None) -> bytes:
        import requests
        import os
        from io import BytesIO
        from PIL import Image

        try:
            # Base person image (transparent background - bg already removed)
            person = Image.open(BytesIO(base_image_bytes)).convert("RGBA")
            
            # Canvas size
            canvas_w, canvas_h = 600, 800
            canvas = Image.new("RGBA", (canvas_w, canvas_h), (255, 255, 255, 255))

            # Load cloth
            if cloth_bytes:
                cloth = Image.open(BytesIO(cloth_bytes)).convert("RGBA")
            elif cloth_id:
                cloth_path = os.path.join(os.getcwd(), "assets", "clothes", cloth_id.replace("/", os.sep))
                if not os.path.exists(cloth_path):
                    raise ValueError(f"Cloth asset not found: {cloth_path}")
                cloth = Image.open(cloth_path).convert("RGBA")
            elif cloth_url and cloth_url.startswith("http"):
                response = requests.get(cloth_url)
                cloth = Image.open(BytesIO(response.content)).convert("RGBA")
            else:
                raise ValueError("Only HTTP URLs, cloth_id, or cloth_bytes supported for cloth right now.")

            # Step 1: Paste PERSON onto canvas first (body visible, bg transparent)
            p_width = max(1, int(canvas_w * pw))
            p_height = max(1, int(canvas_h * ph))
            p_img = person.resize((p_width, p_height), Image.Resampling.LANCZOS)
            canvas.paste(p_img, (int(canvas_w * px), int(canvas_h * py)), p_img)

            # Step 2: Paste CLOTH ON TOP of person
            # Cloth templates have transparent head area - face shows through
            # Cloth opaque area covers the body/old clothes
            c_width = max(1, int(canvas_w * cw))
            c_height = max(1, int(canvas_h * ch))
            c_img = cloth.resize((c_width, c_height), Image.Resampling.LANCZOS)
            canvas.paste(c_img, (int(canvas_w * cx), int(canvas_h * cy)), c_img)

            out_io = BytesIO()
            canvas.convert("RGB").save(out_io, format="PNG")
            return out_io.getvalue()
        except Exception as e:
            print(f"Overlay advanced error: {e}")
            raise
    @staticmethod
    def overlay_cloth(base_image_bytes: bytes, cloth_url: str, scale: float, x: float, y: float) -> bytes:
        import requests
        from io import BytesIO
        from PIL import Image

        try:
            # Load base image
            base = Image.open(BytesIO(base_image_bytes)).convert("RGBA")
            
            # Load cloth image (could be URL or local, assuming URL for placeholders)
            if cloth_url.startswith("http"):
                response = requests.get(cloth_url)
                cloth = Image.open(BytesIO(response.content)).convert("RGBA")
            else:
                raise ValueError("Only HTTP URLs supported for cloth right now.")

            # Calculate new size based on scale. Assuming base image bounds for relative scaling.
            # Usually scale 1.0 means cloth matches base image width
            new_w = int(base.width * scale)
            new_h = int((new_w / cloth.width) * cloth.height)
            cloth = cloth.resize((new_w, new_h), Image.Resampling.LANCZOS)

            # Create a transparent canvas
            canvas = Image.new("RGBA", base.size, (0, 0, 0, 0))
            canvas.paste(base, (0, 0))
            
            # Position cloth
            # (x, y) could be absolute pixels or relative. Let's assume they are relative percentages (0.0 to 1.0)
            # or absolute pixels depending on frontend. If frontend sends absolute layout pixels, we must scale them.
            # Actually, easiest is if frontend sends relative X/Y to the base image width/height.
            paste_x = int(x * base.width)
            paste_y = int(y * base.height)
            
            canvas.paste(cloth, (paste_x, paste_y), cloth)

            out_io = BytesIO()
            canvas.convert("RGB").save(out_io, format="PNG")
            return out_io.getvalue()
        except Exception as e:
            print(f"Overlay cloth error: {e}")
            raise
    @staticmethod
    def resize_image(file_bytes: bytes, width: float, height: float, unit: str = "pixels", format: str = "jpeg", target_kb: Optional[int] = None) -> bytes:
        img = Image.open(io.BytesIO(file_bytes))
        
        # Calculate pixel dimensions based on chosen unit (assumes standard 300 DPI)
        dpi = 300
        u = unit.lower()
        if u == "inches":
            pw = int(width * dpi)
            ph = int(height * dpi)
        elif u == "cm":
            pw = int(width * dpi / 2.54)
            ph = int(height * dpi / 2.54)
        elif u == "mm":
            pw = int(width * dpi / 25.4)
            ph = int(height * dpi / 25.4)
        else: # "pixels"
            pw = int(width)
            ph = int(height)
            
        img = img.resize((pw, ph), Image.Resampling.LANCZOS)
        
        # Normalize format
        fmt = format.upper()
        if fmt == "JPG":
            fmt = "JPEG"
            
        if fmt == "JPEG" and img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        if target_kb and target_kb > 0:
            from utils.compressor import compress_to_target_kb
            return compress_to_target_kb(img, min_kb=0, max_kb=target_kb, format=fmt)
        else:
            output = io.BytesIO()
            img.save(output, format=fmt, quality=95)
            return output.getvalue()

    @staticmethod
    def compress_to_kb(file_bytes: bytes, target_kb: int, format: str = 'JPEG') -> bytes:
        img = Image.open(io.BytesIO(file_bytes))
        from utils.compressor import compress_to_target_kb
        # Standardize format parameter (e.g. JPG to JPEG)
        fmt = format.upper()
        if fmt == 'JPG':
            fmt = 'JPEG'
        return compress_to_target_kb(img, min_kb=0, max_kb=target_kb, format=fmt)

    @staticmethod
    def convert_format(file_bytes: bytes, target_format: str) -> bytes:
        img = Image.open(io.BytesIO(file_bytes))
        if target_format.upper() == 'JPEG' and img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
            
        output = io.BytesIO()
        img.save(output, format=target_format.upper())
        return output.getvalue()
        
    @staticmethod
    def change_dpi(file_bytes: bytes, dpi: int) -> bytes:
        img = Image.open(io.BytesIO(file_bytes))
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        output = io.BytesIO()
        img.save(output, format='JPEG', dpi=(dpi, dpi))
        return output.getvalue()

    @staticmethod
    def apply_filter(file_bytes: bytes, filter_type: str, intensity: float = 1.0) -> bytes:
        img = Image.open(io.BytesIO(file_bytes))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        filter_type = filter_type.lower()
        if filter_type == 'grayscale' or filter_type == 'b&w':
            img = img.convert('L')
        elif filter_type == 'sepia':
            # Sepia conversion formula
            width, height = img.size
            pixels = img.load()
            for x in range(width):
                for y in range(height):
                    r, g, b = pixels[x, y]
                    tr = int(0.393 * r + 0.769 * g + 0.189 * b)
                    tg = int(0.349 * r + 0.686 * g + 0.168 * b)
                    tb = int(0.272 * r + 0.534 * g + 0.131 * b)
                    pixels[x, y] = (min(tr, 255), min(tg, 255), min(tb, 255))
        elif filter_type == 'brightness':
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(intensity)
        elif filter_type == 'contrast':
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(intensity)
        elif filter_type == 'sharpen':
            img = img.filter(ImageFilter.SHARPEN)
            
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=95)
        return output.getvalue()

    @staticmethod
    def make_passport_photo(
        file_bytes: bytes, 
        min_kb: int = 20, 
        max_kb: int = 50, 
        width: float = 3.5, 
        height: float = 4.5, 
        unit: str = "cm", 
        dpi: int = 300,
        brightness: float = 1.0,
        contrast: float = 1.0,
        saturation: float = 1.0,
        zoom: float = 1.0,
        shift_x: float = 0.0,
        shift_y: float = 0.0
    ) -> bytes:
        img = Image.open(io.BytesIO(file_bytes))
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Calculate target pixels based on unit and DPI
        u = unit.lower()
        if u in ("inches", "inch"):
            pw = int(width * dpi)
            ph = int(height * dpi)
        elif u == "cm":
            pw = int(width * dpi / 2.54)
            ph = int(height * dpi / 2.54)
        elif u == "mm":
            pw = int(width * dpi / 25.4)
            ph = int(height * dpi / 25.4)
        else: # "pixels" or "px"
            pw = int(width)
            ph = int(height)
            
        target_ratio = pw / ph
        w_img, h_img = img.size
        current_ratio = w_img / h_img
        
        # Calculate final crop dimensions on original image based on target ratio and zoom
        if current_ratio > target_ratio:
            crop_h = int(h_img / zoom)
            crop_w = int(crop_h * target_ratio)
        else:
            crop_w = int(w_img / zoom)
            crop_h = int(crop_w / target_ratio)
            
        # Base centered coordinates
        left = (w_img - crop_w) // 2
        top = (h_img - crop_h) // 2
        
        # Apply visual translation offsets (dragging right shifts crop window left)
        left = int(left - shift_x * w_img)
        top = int(top - shift_y * h_img)
        
        # Clamp to image boundaries
        left = max(0, min(left, w_img - crop_w))
        top = max(0, min(top, h_img - crop_h))
        
        img = img.crop((left, top, left + crop_w, top + crop_h))

        # 3. Enhance brightness, contrast, saturation
        if brightness != 1.0:
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(brightness)
        if contrast != 1.0:
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(contrast)
        if saturation != 1.0:
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(saturation)
            
        # 4. Resize to target dimension
        img = img.resize((pw, ph), Image.Resampling.LANCZOS)
        
        from utils.compressor import compress_to_target_kb
        return compress_to_target_kb(img, min_kb, max_kb, format='JPEG', allow_resize=False)

    @staticmethod
    def resize_signature(file_bytes: bytes, min_kb: int = 10, max_kb: int = 20, width: float = 140, height: float = 60, unit: str = "pixels", dpi: int = 200) -> bytes:
        img = Image.open(io.BytesIO(file_bytes))
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        # Calculate pixel dimensions based on chosen unit and DPI
        u = unit.lower()
        if u == "inches":
            pw = int(width * dpi)
            ph = int(height * dpi)
        elif u == "cm":
            pw = int(width * dpi / 2.54)
            ph = int(height * dpi / 2.54)
        elif u == "mm":
            pw = int(width * dpi / 25.4)
            ph = int(height * dpi / 25.4)
        else: # "pixels"
            pw = int(width)
            ph = int(height)
            
        target_ratio = pw / ph
        w, h = img.size
        current_ratio = w / h
        
        if current_ratio > target_ratio:
            new_width = int(h * target_ratio)
            left = (w - new_width) // 2
            img = img.crop((left, 0, left + new_width, h))
        elif current_ratio < target_ratio:
            new_height = int(w / target_ratio)
            top = (h - new_height) // 2
            img = img.crop((0, top, w, top + new_height))
            
        img = img.resize((pw, ph), Image.Resampling.LANCZOS)
        
        from utils.compressor import compress_to_target_kb
        return compress_to_target_kb(img, min_kb, max_kb, format='JPEG', allow_resize=False)

    @staticmethod
    def add_name_and_date(file_bytes: bytes, name: str, date_str: str, position: str = "bottom", font_size: int = 24) -> bytes:
        import os
        try:
            img = Image.open(io.BytesIO(file_bytes))
        except Exception as e:
            raise RuntimeError(f"Could not open image. It may be an unsupported format (e.g. HEIC) or corrupted. Error: {e}")
            
        if img.mode != 'RGB':
            # Create a white background for RGBA/transparency
            bg = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'RGBA':
                bg.paste(img, mask=img.split()[3])
            else:
                bg.paste(img)
            img = bg
            
        draw = ImageDraw.Draw(img)
        width, height = img.size
        
        # Auto-scale font size to 8% of photo width to make it size-proportionate and bold-looking
        font_size = max(28, int(width * 0.08))
        
        # Load local arial.ttf copied to backend directory
        font = None
        local_font_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "arial.ttf")
        
        font_paths = [
            local_font_path,
            "arial.ttf",
            "/app/arial.ttf",
            "C:\\Windows\\Fonts\\arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
        ]
        for fp in font_paths:
            if fp and os.path.exists(fp):
                try:
                    font = ImageFont.truetype(fp, font_size)
                    break
                except Exception:
                    pass
        if not font:
            font = ImageFont.load_default()
            
        text = f"{name}\n{date_str}" if date_str else name
        
        # Calculate text bbox size
        try:
            left, top, right, bottom = draw.textbbox((0, 0), text, font=font, align="center")
            w = int(right - left)
            h = int(bottom - top)
        except Exception:
            w, h = draw.textsize(text, font=font) if hasattr(draw, "textsize") else (int(font_size * len(name)), int(font_size * 2))
            
        # Set white box padding relative to font size
        box_height = int(h + int(font_size * 0.8))
        
        new_img = Image.new('RGB', (int(width), int(height + box_height)), color='white')
        draw = ImageDraw.Draw(new_img)
        
        if position == "bottom":
            new_img.paste(img, (0, 0))
            text_x = int((width - w) // 2)
            text_y = int(height + (box_height - h) // 2 - 2)
            draw.text((text_x, text_y), text, fill="black", font=font, align="center")
        else:
            new_img.paste(img, (0, box_height))
            text_x = int((width - w) // 2)
            text_y = int((box_height - h) // 2 - 2)
            draw.text((text_x, text_y), text, fill="black", font=font, align="center")
            
        output = io.BytesIO()
        new_img.save(output, format='JPEG', quality=95)
        return output.getvalue()

    @staticmethod
    def join_photo_signature(photo_bytes: bytes, signature_bytes: bytes) -> bytes:
        photo = Image.open(io.BytesIO(photo_bytes))
        signature = Image.open(io.BytesIO(signature_bytes))
        
        if photo.mode != 'RGB':
            photo = photo.convert('RGB')
        if signature.mode != 'RGB':
            signature = signature.convert('RGB')
            
        photo_w, photo_h = photo.size
        sig_w, sig_h = signature.size
        
        new_sig_h = int(sig_h * (photo_w / sig_w))
        signature = signature.resize((photo_w, new_sig_h), Image.Resampling.LANCZOS)
        
        combined = Image.new('RGB', (photo_w, photo_h + new_sig_h), color='white')
        combined.paste(photo, (0, 0))
        combined.paste(signature, (0, photo_h))
        
        output = io.BytesIO()
        combined.save(output, format='JPEG', quality=95)
        return output.getvalue()

    @staticmethod
    def make_insta_profile(file_bytes: bytes, border_color: str = "gradient") -> bytes:
        img = Image.open(io.BytesIO(file_bytes))
        # Resize to square (500x500)
        img = img.resize((500, 500), Image.Resampling.LANCZOS)
        
        # Create background image for the border
        bg = Image.new('RGB', (500, 500), (228, 64, 95)) # default instagram pink
        draw_bg = ImageDraw.Draw(bg)
        
        if border_color == "gradient":
            # Interpolate concentric circles to make a smooth instagram gradient
            for r in range(250, 220, -1):
                factor = (250 - r) / 30.0
                cr = int(254 * (1 - factor) + 79 * factor)
                cg = int(218 * (1 - factor) + 91 * factor)
                cb = int(119 * (1 - factor) + 213 * factor)
                draw_bg.ellipse((250 - r, 250 - r, 250 + r, 250 + r), fill=(cr, cg, cb))
        elif border_color == "neon-yellow":
            draw_bg.ellipse((0, 0, 500, 500), fill=(223, 255, 0)) # Volt/Neon yellow
        elif border_color == "neon-green":
            draw_bg.ellipse((0, 0, 500, 500), fill=(57, 255, 20)) # Neon green
        elif border_color == "cyan":
            draw_bg.ellipse((0, 0, 500, 500), fill=(0, 255, 255)) # Cyan
        else:
            # Parse hex border color (e.g. #FF5733)
            try:
                from PIL import ImageColor
                color_tuple = ImageColor.getrgb(border_color)
                draw_bg.ellipse((0, 0, 500, 500), fill=color_tuple)
            except:
                pass
        
        # Crop original to circle of 460x460
        cropped = Image.new('RGBA', (460, 460), (0, 0, 0, 0))
        img_cropped = img.resize((460, 460), Image.Resampling.LANCZOS)
        mask_cropped = Image.new('L', (460, 460), 0)
        draw_cropped = ImageDraw.Draw(mask_cropped)
        draw_cropped.ellipse((0, 0, 460, 460), fill=255)
        
        cropped.paste(img_cropped, (0, 0), mask_cropped)
        
        # Convert bg to RGBA and paste the cropped circle in the center (offset 20, 20)
        bg = bg.convert('RGBA')
        bg.paste(cropped, (20, 20), cropped)
        
        # Save as PNG
        output = io.BytesIO()
        bg.save(output, format='PNG')
        return output.getvalue()

    @staticmethod
    def make_passport_sheet(image_bytes: bytes, sheet_type: str = "A4", custom_w_mm: float = 210.0, custom_h_mm: float = 297.0) -> bytes:
        from PIL import Image, ImageDraw
        import io

        DPI = 300
        MM_TO_PX = DPI / 25.4  # ~11.81 pixels per mm

        # India standard passport photo: 35mm x 45mm
        PHOTO_W_PX = int(35 * MM_TO_PX)   # ~413 px
        PHOTO_H_PX = int(45 * MM_TO_PX)   # ~531 px

        # Border and padding settings
        BORDER_PX = 3      # visible black border thickness
        PADDING_PX = 0     # padding between border and photo edge
        # Each cell = photo + padding on each side + border on each side
        CELL_W = PHOTO_W_PX + 2 * PADDING_PX
        CELL_H = PHOTO_H_PX + 2 * PADDING_PX
        SPACING_PX = int(4 * MM_TO_PX)  # 4mm white gap between cells = ~47px

        # Resize input photo to EXACT passport dimensions
        photo = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        photo = photo.resize((PHOTO_W_PX, PHOTO_H_PX), Image.Resampling.LANCZOS)

        # Canvas size from sheet type (all in mm → pixels)
        if sheet_type.lower() == "a4":
            canvas_w = int(210 * MM_TO_PX)  # 2480 px
            canvas_h = int(297 * MM_TO_PX)  # 3508 px
            margin_px = int(8 * MM_TO_PX)
        elif sheet_type.lower() == "3 / a4":
            canvas_w = int(210 * MM_TO_PX)
            canvas_h = int(99 * MM_TO_PX)
            margin_px = int(3 * MM_TO_PX)
        elif sheet_type.lower() == "custom":
            canvas_w = int(custom_w_mm * MM_TO_PX)
            canvas_h = int(custom_h_mm * MM_TO_PX)
            margin_px = int(4 * MM_TO_PX)
        else:
            canvas_w = int(210 * MM_TO_PX)
            canvas_h = int(297 * MM_TO_PX)
            margin_px = int(8 * MM_TO_PX)

        canvas = Image.new('RGB', (canvas_w, canvas_h), color=(255, 255, 255))
        draw = ImageDraw.Draw(canvas)

        # Calculate how many cells fit
        cols = max(1, (canvas_w - 2 * margin_px + SPACING_PX) // (CELL_W + SPACING_PX))
        rows = max(1, (canvas_h - 2 * margin_px + SPACING_PX) // (CELL_H + SPACING_PX))

        # Center the grid on the canvas
        total_grid_w = cols * CELL_W + (cols - 1) * SPACING_PX
        total_grid_h = rows * CELL_H + (rows - 1) * SPACING_PX
        start_x = (canvas_w - total_grid_w) // 2
        start_y = (canvas_h - total_grid_h) // 2

        for r in range(rows):
            for c in range(cols):
                # Top-left of the photo area (NOT counting border)
                cx = start_x + c * (CELL_W + SPACING_PX)
                cy = start_y + r * (CELL_H + SPACING_PX)

                # Step 1: FILL the border area with solid black
                # This paints a black rectangle BORDER_PX pixels wider on all sides
                draw.rectangle(
                    [cx - BORDER_PX, cy - BORDER_PX,
                     cx + PHOTO_W_PX + BORDER_PX - 1,
                     cy + PHOTO_H_PX + BORDER_PX - 1],
                    fill=(0, 0, 0)
                )

                # Step 2: Paste the photo ON TOP — photo covers the inside,
                # leaving BORDER_PX of black visible around all 4 edges
                canvas.paste(photo, (cx, cy))

        output = io.BytesIO()
        canvas.save(output, format='PNG', dpi=(DPI, DPI))
        return output.getvalue()