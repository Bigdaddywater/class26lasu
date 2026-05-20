from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import session
from app.models import models
from app.schemas import memory as schemas
from app.core.config import settings

router = APIRouter()

@router.get("/", response_model=List[schemas.Memory])
def read_memories(
    db: Session = Depends(session.get_db),
    skip: int = 0,
    limit: int = 100,
    faculty: str = None
) -> Any:
    query = db.query(models.Memory).filter(models.Memory.approved == True)
    if faculty:
        query = query.filter(models.Memory.faculty == faculty)
    return query.offset(skip).limit(limit).all()

@router.post("/upload", response_model=schemas.Memory)
async def upload_memory(
    *,
    db: Session = Depends(session.get_db),
    file: UploadFile = File(...),
    title: str = None,
    caption: str = None,
    faculty: str = None
) -> Any:
    # Logic for Cloudinary upload would go here
    # For now, simulate media_url
    media_url = f"https://cdn.lasu2026.com/uploads/{file.filename}"
    
    memory = models.Memory(
        title=title,
        description=caption,
        media_url=media_url,
        media_type="image", # Detect from file content type normally
        faculty=faculty,
        uploader_id=1, # Get from current user in token
        approved=False
    )
    db.add(memory)
    db.commit()
    db.refresh(memory)
    return memory
