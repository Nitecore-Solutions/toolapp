import io
import cv2
import numpy as np
from rembg import remove, new_session
from PIL import Image

# Session cache for state-of-the-art AI models
_sessions = {}

def get_session(model_name: str = "birefnet-general"):
    """Fetch cached model session or load new session."""
    global _sessions
    if model_name in _sessions:
        return _sessions[model_name]
    
    try:
        print(f"[BG REMOVE] Loading AI Model Session '{model_name}'...", flush=True)
        _sessions[model_name] = new_session(model_name)
        return _sessions[model_name]
    except Exception as e:
        print(f"[BG REMOVE] Could not load AI model '{model_name}': {e}", flush=True)
        return None

def get_best_available_session():
    """Cascade through AI models - light to heavy for server stability:
    1. isnet-general-use (Fast, accurate, ~50MB)
    2. u2net_human_seg (Human segmentation, ~170MB)
    3. u2net (Standard fallback, ~170MB)
    """
    model_priority = [
        "isnet-general-use",
        "u2net_human_seg",
        "u2net"
    ]
    for model_name in model_priority:
        sess = get_session(model_name)
        if sess is not None:
            return sess, model_name
    return None, "u2net"


class BgRemoveService:
    @staticmethod
    def remove_background(file_bytes: bytes, mode: str = "auto") -> bytes:
        """Remove background from an image."""
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return file_bytes

        if mode == "signature":
            print("[BG REMOVE] Running Signature Mode", flush=True)
            return BgRemoveService.remove_signature_background(file_bytes)

        if mode == "auto":
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            bright_ratio = np.sum(gray > 200) / gray.size
            mean_sat = np.mean(cv2.cvtColor(img, cv2.COLOR_BGR2HSV)[:, :, 1])
            if mean_sat < 15 and bright_ratio > 0.70:
                print("[BG REMOVE] Signature detected (auto)", flush=True)
                return BgRemoveService.remove_signature_background(file_bytes)

        print("[BG REMOVE] Running AI Cutout...", flush=True)
        input_image = Image.open(io.BytesIO(file_bytes))
        
        session, model_used = get_best_available_session()
        print(f"[BG REMOVE] Model: {model_used}", flush=True)

        if session:
            output_image = remove(input_image, session=session, post_process_mask=True)
        else:
            output_image = remove(input_image, post_process_mask=True)

        output = io.BytesIO()
        output_image.save(output, format='PNG')
        return output.getvalue()

    @staticmethod
    def refine_alpha_edges(pil_img: Image.Image) -> Image.Image:
        """Apply smooth edge anti-aliasing to match remove.bg quality."""
        try:
            img_rgba = np.array(pil_img)
            if len(img_rgba.shape) < 3 or img_rgba.shape[2] != 4:
                return pil_img
            
            b, g, r, a = cv2.split(img_rgba)

            # Detect semi-transparent transition boundary zone
            edge_zone = (a > 10) & (a < 245)
            if np.any(edge_zone):
                # Smooth alpha channel along boundary edges
                blurred_a = cv2.GaussianBlur(a, (3, 3), 0)
                a[edge_zone] = blurred_a[edge_zone]

            refined_rgba = cv2.merge([b, g, r, a])
            return Image.fromarray(refined_rgba)
        except Exception as err:
            print(f"[BG REMOVE] Edge refinement note: {err}", flush=True)
            return pil_img

    @staticmethod
    def remove_signature_background(file_bytes: bytes) -> bytes:
        """Extract signature/ink from white paper by normalizing background light and making it transparent."""
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return file_bytes

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (35, 35))
        background = cv2.dilate(gray, kernel)
        background = cv2.medianBlur(background, 21)

        normalized = cv2.divide(gray, background, scale=255)

        b, g, r = cv2.split(img)
        alpha = np.zeros_like(normalized)

        fg_mask = normalized < 180
        alpha[fg_mask] = 255

        transition_mask = (normalized >= 180) & (normalized <= 240)
        alpha[transition_mask] = ((240 - normalized[transition_mask]) / (240 - 180) * 255).astype(np.uint8)

        rgba = cv2.merge([b, g, r, alpha])

        _, encoded = cv2.imencode('.png', rgba)
        return encoded.tobytes()
