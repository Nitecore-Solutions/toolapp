from fastapi import APIRouter, Response, HTTPException
from models.schemas import ResumeData, AgeCalculatorRequest
from services.resume_service import ResumeService, AgeCalculatorService

router = APIRouter(prefix="/api/utility", tags=["Utility Tools"])

@router.post("/resume")
def generate_resume(data: ResumeData):
    try:
        # Convert Pydantic model to dictionary
        data_dict = data.model_dump()
        pdf_bytes = ResumeService.generate_resume_pdf(data_dict)
        return Response(
            content=pdf_bytes, 
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=resume.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/age-calculator")
def calculate_age(request: AgeCalculatorRequest):
    try:
        result = AgeCalculatorService.calculate_age(request.dob, request.as_of_date)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
