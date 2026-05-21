from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import session
from app.models import models
from app.schemas import memory as schemas
from app.core.config import settings

router = APIRouter()

@router.get("/", response_model=List[schemas.Memory])
async def read_memories(
    db: AsyncSession = Depends(session.get_db),
    skip: int = 0,
    limit: int = 100,
    faculty: str = None
) -> Any:
    stmt = select(models.Memory).filter(models.Memory.approved == True)
    if faculty:
        stmt = stmt.filter(models.Memory.faculty == faculty)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

import cloudinary.uploader

@router.post("/upload", response_model=schemas.Memory)
async def upload_memory(
    *,
    db: AsyncSession = Depends(session.get_db),
    file: UploadFile = File(...),
    title: str = None,
    caption: str = None,
    faculty: str = None
) -> Any:
    # Upload to Cloudinary
    result = cloudinary.uploader.upload(file.file, folder="lasu2026", resource_type="auto")
    media_url = result.get("secure_url")
    media_type = "video" if file.content_type and file.content_type.startswith("video") else "image"
    
    memory = models.Memory(
        title=title,
        description=caption,
        media_url=media_url,
        media_type=media_type,
        faculty=faculty,
        uploader_id=1, # Get from current user in token
        approved=False
    )
    db.add(memory)
    await db.commit()
    await db.refresh(memory)
    return memory
