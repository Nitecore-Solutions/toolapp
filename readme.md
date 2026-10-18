# Bharat Job Result — All-in-One Tool App

A comprehensive Photo/Document utility app designed for Sarkari exam form filling (Passport photo, Signature resize, PDF tools, Image tools). Features **25 tools** based on the utility stack of [bharatjobresult.com/bharat-job-result-tool/](https://bharatjobresult.com/bharat-job-result-tool/).

---

## 🚀 Tech Stack

### Backend
- **FastAPI** (Python) — Fast, asynchronous web API framework.
- **Pillow & OpenCV** — Image manipulation, scaling, and DPI setting.
- **rembg** — Local AI background removal (U2Net model).
- **img2pdf / pypdf / pdf2image** — High performance PDF manipulation (splitting, merging, rotating, image conversion).
- **WeasyPrint & Jinja2** — HTML template rendering and PDF generation (Resume Maker).
- **Uvicorn** — ASGI web server.

### Frontend
- **React Native (Expo SDK 54)** — Cross-platform mobile app UI.
- **TypeScript** — For type-safety and robust code structure.
- **Outfit Google Font** — Premium, clean typography.
- **React Navigation v7** — Stack navigation + Bottom-Tabs navigation.
- **Axios** — API communication client.
- **Expo Image/Document Picker** — Direct camera/gallery media access.
- **Expo File System & Sharing** — Local temp file saving, downloading, and sharing.

---

## 📂 Project Directory Structure

```
toolapp/
├── backend/
│   ├── main.py                  # FastAPI app entrypoint & CORS middleware
│   ├── requirements.txt         # Python dependencies
│   ├── presets.json             # Exam-wise target sizes & KB constraints
│   ├── routers/                 # API endpoint routers
│   │   ├── image_tools.py       # resize, compress, format convert, filter, dpi, remove-bg
│   │   ├── pdf_tools.py         # image-to-pdf, pdf-to-jpg, edit-pdf (merge/split/rotate)
│   │   ├── overlay_tools.py     # add name & date, photo-signature joiner
│   │   ├── form_tools.py        # all govt exam resizers (parameterized via presets.json)
│   │   └── utility_tools.py     # resume maker, age calculator
│   ├── services/                # Core processing engines
│   │   ├── image_service.py     # Image resizing, cropping, and DPI settings
│   │   ├── pdf_service.py       # PDF conversion & merging logic
│   │   ├── bg_remove_service.py # rembg AI background removal
│   │   └── resume_service.py    # HTML templates to PDF conversion
│   ├── models/
│   │   └── schemas.py           # Pydantic request/response validation schemas
│   └── utils/
│       ├── file_handler.py      # Temporary file saving and cleanups
│       └── compressor.py        # Binary-search based "Compress to target KB" algorithm
│
└── frontend/
    ├── App.tsx                  # Root Expo application entry
    ├── app.json                 # Expo configuration (app metadata, icons, splash screen)
    ├── package.json             # Node dependencies and scripts
    ├── tsconfig.json            # TypeScript configuration
    ├── .env                     # Local API environment variables
    └── src/
        ├── api/
        │   └── client.ts        # Axios base client, backend endpoint helpers
        ├── components/
        │   ├── ImagePickerBox.tsx # Multi-use media upload component
        │   └── ToolCard.tsx     # Reusable UI card for home screen grid
        ├── constants/
        │   └── tools.ts         # Central configuration and endpoints for 25 tools
        ├── navigation/
        │   └── AppNavigator.tsx # App route configuration (Home & Tool Screens)
        └── screens/
            ├── HomeScreen.tsx   # Dashboard with categorized grid list of 25 tools
            └── ToolScreens/     # Categorized screens matching the backend routers
                ├── Govt/        # Govt exam spec resizers (India Post, NSDL PAN, RRB, SSC, UPSC)
                ├── Image/       # Image actions (Compress, Resize, Background Remove, Filter, etc.)
                ├── Pdf/         # PDF tools (Image to PDF, PDF to JPG, Edit PDF)
                └── Utility/     # General utility tools (Resume Maker, Age Calculator)
```

---

## 🛠️ Local Development & Setup

### 1. Backend Setup (FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\activate

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the development server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   *The Swagger UI API docs will be available at `http://127.0.0.1:8000/docs`.*

### 🐳 Running Backend with Docker
Alternatively, you can run the backend inside a Docker container using Docker Compose. This automatically handles all system dependencies (Pango, Cairo, Poppler, etc.).

1. Build and start the container:
   ```bash
   docker compose up --build
   ```
2. The backend will be live at `http://localhost:8000`. Changes in your local `backend` directory will hot-reload in the container.

---

### 2. Frontend Setup (React Native Expo)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node modules:
   ```bash
   npm install
   ```
3. Configure your local environment variables in `frontend/.env`:
   ```env
   # Replace with your local machine's IP (e.g. 192.168.x.x) or an active ngrok tunnel URL
   EXPO_PUBLIC_API_URL=http://localhost:8000
   ```
4. Start the Expo development server:
   ```bash
   npm run dev
   # or to clear cache
   npx expo start --clear
   ```
5. Scan the QR code using the **Expo Go** app (Android) or the Camera app (iOS) to test on a physical device, or run on an emulator by pressing `a` (Android) or `i` (iOS).

---

## 📱 Supported Tools (25 Total)

### 🖼️ General Image Tools (in `src/screens/ToolScreens/Image`)
1. **Compress to KB**: Compress image to custom target size (e.g. 50KB, 100KB).
2. **Image to 20KB**: Instantly compress image to exactly <=20KB (standard exam requirement).
3. **Image Resizer**: Resize image to custom width × height dimensions.
4. **Change Image Format**: Convert between JPG, PNG, WEBP, and BMP formats.
5. **DPI Converter**: Adjust metadata and resample image DPI (e.g. 200 DPI, 300 DPI).
6. **Filter**: Apply B&W, sepia, brightness, contrast, and sharpen filters.
7. **Add Name & Date**: Overlay custom name and date text on standard photo templates.
8. **Join Photo & Sig**: Merge a passport photo and signature horizontally/vertically.
9. **Passport Size Photo**: Auto-crop and resize to passport dimensions.
10. **Remove Background**: Remove background from any image locally.
11. **Signature Resizer**: Resize signatures to standard 140x60px.

### 📄 PDF Tools (in `src/screens/ToolScreens/Pdf`)
12. **Image to PDF**: Convert single or multiple images into a single PDF document.
13. **PDF to JPG**: Extract individual pages of a PDF as high-quality JPG files.
14. **Edit PDF**: Basic PDF editing operations (merge, split, page extraction).

### 🏛️ Govt Exam Form Tools (in `src/screens/ToolScreens/Govt`)
These screens offer auto-resized presets conforming to the rules of national recruitment portal guidelines:
15. **NSDL PAN Photo Resizer**: Resize to 213x213px, <20KB JPG.
16. **NSDL PAN Signature Resizer**: Resize to 200x100px, <20KB JPG.
17. **RRB Photo Resizer**: Resize to 3.5cm x 4.5cm, 20KB-50KB JPG.
18. **RRB Signature Resizer**: Resize to 140x60px, 10KB-20KB JPG.
19. **India Post Photo Resizer**: Resize for India Post GDS notifications (3.5x4.5cm, 30KB-50KB).
20. **India Post Signature Resizer**: Aspect-corrected resizer matching current GDS rules.
21. **UPSC Photo Resizer**: Resize to 200x230px, <300KB.
22. **SSC Signature Resizer**: Resize signatures matching current SSC specifications (10-20KB).
23. **Upsc Photo Screen**: Dedicated UPSC document and photo handler.

### ⚙️ Utility Tools (in `src/screens/ToolScreens/Utility`)
24. **Resume Maker**: Dynamic JSON form inputs generating clean, formatted PDF resumes.
25. **Age Calculator**: Accurate age calculator (Years, Months, Days) from date of birth.
# toolapp
