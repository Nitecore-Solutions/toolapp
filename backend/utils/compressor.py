import io
from PIL import Image

def compress_to_target_kb(img: Image.Image, min_kb: int = 0, max_kb: int = 20, format: str = 'JPEG', allow_resize: bool = True) -> bytes:
    """
    Binary-search based compression to hit a target KB range.
    If even quality=1 is too big, we progressively downscale dimensions if allow_resize is True.
    """
    if img.mode != 'RGB':
        img = img.convert('RGB')

    target_min = min_kb * 1024
    target_max = max_kb * 1024
    
    # Enforce a minimum quality to avoid extreme blockiness.
    # If the file is still too big at min_quality, we will downscale resolution instead.
    # Lowered from 60 to 45 to preserve physical dimensions longer before shrinking.
    min_quality = 45

    # Try binary search on JPEG/WEBP quality
    best_output = None
    
    if format.upper() in ('JPEG', 'JPG', 'WEBP'):
        low, high = min_quality, 95
        while low <= high:
            mid = (low + high) // 2
            output = io.BytesIO()
            img.save(output, format=format, quality=mid)
            size = output.tell()

            if size <= target_max:
                best_output = output.getvalue()
                if size >= target_min:
                    return best_output  # Perfect — within range
                low = mid + 1  # Try higher quality to increase size
            else:
                high = mid - 1
    else:
        # For PNG/GIF, quality is mostly ignored, so just check size once
        output = io.BytesIO()
        img.save(output, format=format)
        size = output.tell()
        if size <= target_max:
            return output.getvalue()

    if best_output:
        return best_output
        
    if not allow_resize:
        # If we cannot resize, just return the lowest quality we tried, even if it exceeds target_max
        output = io.BytesIO()
        img.save(output, format=format, quality=min_quality)
        return output.getvalue()

    import math
    current_size = len(best_output) if best_output else size
    # Area scales quadratically with dimensions, so size scales roughly with (scale_factor)^2
    # To be safe and not overshoot, we add a 10% buffer
    scale_factor = math.sqrt(target_max / current_size) * 1.1
    # Clamp scale factor between 0.2 and 0.85 to ensure progress without extreme jumps
    scale_factor = max(0.2, min(0.85, scale_factor))

    # If still too big at min_quality, downscale dimensions and retry
    new_width = int(img.width * scale_factor)
    new_height = int(img.height * scale_factor)
    
    # Failsafe for extremely small dimensions
    if new_width < 10 or new_height < 10:
        # Extreme fallback: allow lower quality
        output = io.BytesIO()
        img.save(output, format=format, quality=20, optimize=True)
        return output.getvalue()

    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    return compress_to_target_kb(img, min_kb, max_kb, format, allow_resize=True)


def validate_file(file_bytes: bytes, max_size_mb: int = 10, allowed_types: list = None) -> bool:
    """Validate file size and type."""
    if len(file_bytes) > max_size_mb * 1024 * 1024:
        return False
    if allowed_types:
        try:
            img = Image.open(io.BytesIO(file_bytes))
            if img.format and img.format.lower() not in [t.lower() for t in allowed_types]:
                return False
        except Exception:
            return False
    return True
