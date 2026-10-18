from pydantic import BaseModel
from typing import List, Optional

class AgeCalculatorRequest(BaseModel):
    dob: str
    as_of_date: Optional[str] = None

class EducationItem(BaseModel):
    exam_name: Optional[str] = None
    degree: Optional[str] = None
    institution: Optional[str] = None
    board: Optional[str] = None
    year: Optional[str] = None
    cgpa: Optional[str] = None
    description: Optional[str] = None

class ExperienceItem(BaseModel):
    title: str
    company: str
    duration: str
    description: Optional[str] = None

class CertificationItem(BaseModel):
    name: str
    issuer: Optional[str] = None
    year: Optional[str] = None

class ProjectItem(BaseModel):
    name: str
    description: Optional[str] = None

class PersonalDetails(BaseModel):
    father_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    languages: Optional[str] = None
    religion: Optional[str] = None
    hobbies: Optional[str] = None

class ResumeData(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    objective: Optional[str] = None
    education: Optional[List[EducationItem]] = []
    experience: Optional[List[ExperienceItem]] = []
    skills: Optional[List[str]] = []
    certifications: Optional[List[CertificationItem]] = []
    projects: Optional[List[ProjectItem]] = []
    personal_details: Optional[PersonalDetails] = None
    declaration: Optional[str] = None
    photo_base64: Optional[str] = None


class PdfElement(BaseModel):
    id: Optional[str] = "element"
    type: str
    page: int
    x: float
    y: float
    width: float
    height: float
    is_existing: bool = False
    original_text: Optional[str] = None
    orig_x: Optional[float] = None
    orig_y: Optional[float] = None
    orig_width: Optional[float] = None
    orig_height: Optional[float] = None
    text: Optional[str] = None
    font_size: Optional[float] = None
    font_family: Optional[str] = None
    color: Optional[str] = None
    is_bold: Optional[bool] = False
    is_italic: Optional[bool] = False
    is_underline: Optional[bool] = False
    text_align: Optional[str] = None
    image_data: Optional[str] = None
    shape_type: Optional[str] = None
    border_color: Optional[str] = None
    fill_color: Optional[str] = None
    border_width: Optional[float] = None
    highlight_color: Optional[str] = None
    path_data: Optional[str] = None
    stroke_color: Optional[str] = None
    stroke_width: Optional[float] = None
