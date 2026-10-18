from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from deps import limiter
import os
from routers import image_tools, pdf_tools, overlay_tools, form_tools, utility_tools

app = FastAPI(title="Nexopps Tool API")

# Rate limit exceeded handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — specific domains only (security fix)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://toolapp.nexopps.in",
        "https://nexopps.in",
        "https://www.nexopps.in",
        "https://bharatjobresult.com",
        "https://www.bharatjobresult.com",
        "https://biharigyan.com",
        "https://www.biharigyan.com",
        "https://aquamarine-monkey-514242.hostingersite.com",  # New production frontend
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501",
        "http://127.0.0.1:8080",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def preload_ai_model():
    """Pre-load AI model on server startup so first request is fast."""
    print("[STARTUP] Pre-loading AI model...", flush=True)
    from services.bg_remove_service import get_best_available_session
    sess, name = get_best_available_session()
    print(f"[STARTUP] AI Model ready: {name}", flush=True)

app.include_router(image_tools.router)
app.include_router(pdf_tools.router)
app.include_router(overlay_tools.router)
app.include_router(form_tools.router)
app.include_router(utility_tools.router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Nexopps Tool API is running"}

@app.get("/health")
def health_check():
    """Health check endpoint for uptime monitoring"""
    return {"status": "healthy"}

@app.get("/privacy", response_class=HTMLResponse)
@app.get("/privacy.html", response_class=HTMLResponse)
def read_privacy():
    privacy_file_path = os.path.join(os.path.dirname(__file__), "privacy.html")
    if os.path.exists(privacy_file_path):
        with open(privacy_file_path, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read(), status_code=200)
    return HTMLResponse(content="<h1>Privacy Policy Not Found</h1>", status_code=404)

# Global exception handler — server crash se bachao
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[ERROR] Unhandled exception: {exc}", flush=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error. Please try again."}
    )
