import os
import shutil
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
from collections import deque
from scipy.ndimage import binary_dilation

def extract_clean_squircle_badge(logo_path: str) -> Image.Image:
    """
    Extracts the squircle badge from logo2.jpeg by:
    1. Flood-filling the white background from all four corners
    2. Slightly dilating into the boundary to remove JPEG compression noise
    3. Applying a smooth anti-aliased alpha mask
    4. Centering the extracted badge onto a square transparent RGBA canvas
    """
    im = Image.open(logo_path).convert('RGB')
    arr = np.array(im)
    h, w, _ = arr.shape

    # Flood fill outer white
    is_white = np.all(arr > 230, axis=2)
    visited = np.zeros((h, w), dtype=bool)
    q = deque([(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)])
    for y, x in q:
        visited[y, x] = True

    while q:
        y, x = q.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w:
                if not visited[ny, nx] and is_white[ny, nx]:
                    visited[ny, nx] = True
                    q.append((ny, nx))

    # Dilate visited by 2px to remove edge fringe
    visited_dilated = binary_dilation(visited, iterations=2)
    mask = Image.fromarray((~visited_dilated * 255).astype(np.uint8))
    mask_smooth = mask.filter(ImageFilter.GaussianBlur(radius=0.8))

    rgba = im.convert('RGBA')
    rgba.putalpha(mask_smooth)

    bbox = rgba.getbbox()
    badge = rgba.crop(bbox)
    bw, bh = badge.size
    max_dim = max(bw, bh)
    square_badge = Image.new('RGBA', (max_dim, max_dim), (0, 0, 0, 0))
    square_badge.paste(badge, ((max_dim - bw) // 2, (max_dim - bh) // 2))
    return square_badge

def main():
    assets_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.dirname(assets_dir)
    res_dir = os.path.join(frontend_dir, 'android', 'app', 'src', 'main', 'res')
    
    logo2_path = os.path.join(assets_dir, 'logo2.jpeg')
    if not os.path.exists(logo2_path):
        print(f"Error: {logo2_path} not found.")
        return

    print("Extracting clean squircle badge...")
    square_badge = extract_clean_squircle_badge(logo2_path)

    # 1. favicon.png (48x48)
    favicon = square_badge.resize((48, 48), Image.Resampling.LANCZOS)
    favicon.save(os.path.join(assets_dir, 'favicon.png'), 'PNG')
    print("Generated assets/favicon.png")

    # 2. icon.png (1024x1024) - App store representation
    icon_img = Image.new('RGBA', (1024, 1024), (255, 255, 255, 255))
    icon_badge = square_badge.resize((960, 960), Image.Resampling.LANCZOS)
    icon_img.paste(icon_badge, (32, 32), icon_badge)
    icon_img.convert('RGB').save(os.path.join(assets_dir, 'icon.png'), 'PNG')
    print("Generated assets/icon.png")

    # 3. android-icon-foreground.png (1080x1080)
    # The active/foreground layer of the adaptive icon. Scaled to 560x560 to fit perfectly
    # within Android's 66dp (660px) safe zone circle without any edge clipping on circular,
    # squircle, or rounded-rect launcher masks.
    fg_canvas = Image.new('RGBA', (1080, 1080), (0, 0, 0, 0))
    fg_badge = square_badge.resize((560, 560), Image.Resampling.LANCZOS)
    fg_canvas.paste(fg_badge, (260, 260), fg_badge)
    fg_canvas.save(os.path.join(assets_dir, 'android-icon-foreground.png'), 'PNG')
    print("Generated assets/android-icon-foreground.png")

    # 6. Android Mipmaps
    densities = {
        'mipmap-mdpi':    {'legacy': 48,  'fg': 108},
        'mipmap-hdpi':    {'legacy': 72,  'fg': 162},
        'mipmap-xhdpi':   {'legacy': 96,  'fg': 216},
        'mipmap-xxhdpi':  {'legacy': 144, 'fg': 324},
        'mipmap-xxxhdpi': {'legacy': 192, 'fg': 432},
    }

    if os.path.exists(res_dir):
        for folder, dims in densities.items():
            folder_path = os.path.join(res_dir, folder)
            os.makedirs(folder_path, exist_ok=True)

            # Adaptive Foreground
            fg_dim = dims['fg']
            fg_webp = Image.new('RGBA', (fg_dim, fg_dim), (0, 0, 0, 0))
            b_dim = round(fg_dim * (560 / 1080))
            b_img = square_badge.resize((b_dim, b_dim), Image.Resampling.LANCZOS)
            offset = (fg_dim - b_dim) // 2
            fg_webp.paste(b_img, (offset, offset), b_img)
            fg_webp.save(os.path.join(folder_path, 'ic_launcher_foreground.webp'), 'WEBP', lossless=True)

            # Round Icon (white circular container + badge)
            leg_dim = dims['legacy']
            round_canvas = Image.new('RGBA', (leg_dim, leg_dim), (0, 0, 0, 0))
            circle_mask = Image.new('L', (leg_dim * 4, leg_dim * 4), 0)
            d = ImageDraw.Draw(circle_mask)
            d.ellipse((2, 2, leg_dim * 4 - 2, leg_dim * 4 - 2), fill=255)
            circle_mask = circle_mask.resize((leg_dim, leg_dim), Image.Resampling.LANCZOS)

            white_bg = Image.new('RGBA', (leg_dim, leg_dim), (255, 255, 255, 255))
            round_canvas.paste(white_bg, (0, 0), circle_mask)

            rb_dim = round(leg_dim * 0.70)
            rb_img = square_badge.resize((rb_dim, rb_dim), Image.Resampling.LANCZOS)
            r_offset = (leg_dim - rb_dim) // 2
            round_canvas.paste(rb_img, (r_offset, r_offset), rb_img)

            final_round = Image.new('RGBA', (leg_dim, leg_dim), (0, 0, 0, 0))
            final_round.paste(round_canvas, (0, 0), circle_mask)
            final_round.save(os.path.join(folder_path, 'ic_launcher_round.webp'), 'WEBP', lossless=True)

            # Legacy Icon (squircle on transparent background)
            legacy_canvas = Image.new('RGBA', (leg_dim, leg_dim), (0, 0, 0, 0))
            lb_dim = round(leg_dim * 0.92)
            lb_img = square_badge.resize((lb_dim, lb_dim), Image.Resampling.LANCZOS)
            l_offset = (leg_dim - lb_dim) // 2
            legacy_canvas.paste(lb_img, (l_offset, l_offset), lb_img)
            legacy_canvas.save(os.path.join(folder_path, 'ic_launcher.webp'), 'WEBP', lossless=True)

        print("Generated Android mipmap webp icons")

        # 7. Android Splashscreen Logos
        splash_densities = {
            'drawable-mdpi': 288,
            'drawable-hdpi': 432,
            'drawable-xhdpi': 576,
            'drawable-xxhdpi': 864,
            'drawable-xxxhdpi': 1152,
        }

        for folder, dim in splash_densities.items():
            folder_path = os.path.join(res_dir, folder)
            os.makedirs(folder_path, exist_ok=True)
            splash_canvas = Image.new('RGBA', (dim, dim), (0, 0, 0, 0))
            sb_dim = round(dim * 0.50)
            sb_img = square_badge.resize((sb_dim, sb_dim), Image.Resampling.LANCZOS)
            offset = (dim - sb_dim) // 2
            splash_canvas.paste(sb_img, (offset, offset), sb_img)
            splash_canvas.save(os.path.join(folder_path, 'splashscreen_logo.png'), 'PNG')

        print("Generated Android splashscreen logos")

if __name__ == "__main__":
    main()
