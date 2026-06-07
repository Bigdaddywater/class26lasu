from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import session
from app.models import models
from app.schemas import memory as schemas
from app.core.config import settings
import cloudinary.uploader

router = APIRouter()


@router.get("", response_model=List[schemas.Memory])
async def read_memories(
    db: AsyncSession = Depends(session.get_db),
    skip: int = 0,
    limit: int = 100,
    faculty: str = None
) -> Any:
    """Public endpoint: List approved memories, newest first."""
    stmt = select(models.Memory).filter(models.Memory.approved == True)
    if faculty:
        stmt = stmt.filter(models.Memory.faculty == faculty)
    stmt = stmt.order_by(models.Memory.created_at.desc())
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


# Static routes MUST come before dynamic /{memory_id} routes
@router.post("/upload", response_model=schemas.Memory)
async def upload_memory(
    *,
    db: AsyncSession = Depends(session.get_db),
    file: UploadFile = File(...),
    thumbnail: UploadFile = File(None),
    title: str = Form(None),
    description: str = Form(None),
    faculty: str = Form(None),
    tags: str = Form(None),
    people: str = Form(None),
    uploader_name: str = Form("Anonymous")
) -> Any:
    """Upload a new memory with optional thumbnail."""
    try:
        contents = await file.read()
        result = cloudinary.uploader.upload(contents, folder="lasu2026", resource_type="auto")
        media_url = result.get("secure_url")
        media_type = "video" if file.content_type and file.content_type.startswith("video") else "image"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cloudinary upload failed: {str(e)}")
    
    # Upload thumbnail if provided
    thumbnail_url = None
    if thumbnail:
        try:
            thumb_contents = await thumbnail.read()
            thumb_result = cloudinary.uploader.upload(thumb_contents, folder="lasu2026/thumbs", resource_type="image")
            thumbnail_url = thumb_result.get("secure_url")
        except Exception:
            pass  # Non-critical: continue without thumbnail
    
    memory = models.Memory(
        title=title,
        description=description,
        media_url=media_url,
        thumbnail_url=thumbnail_url,
        media_type=media_type,
        faculty=faculty,
        tags=tags,
        people=people,
        uploader_name=uploader_name or "Anonymous",
        uploader_id=1,
        approved=True
    )
    db.add(memory)
    await db.commit()
    await db.refresh(memory)
    return memory


# Dynamic parameter routes below
@router.get("/{memory_id}", response_model=schemas.Memory)
async def get_memory(
    memory_id: int,
    db: AsyncSession = Depends(session.get_db),
) -> Any:
    """Public endpoint: Get a single memory by ID."""
    stmt = select(models.Memory).filter(models.Memory.id == memory_id)
    result = await db.execute(stmt)
    memory = result.scalar_one_or_none()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    return memory


@router.post("/{memory_id}/like")
async def like_memory(
    memory_id: int,
    db: AsyncSession = Depends(session.get_db),
) -> Any:
    """Public endpoint: Like a memory (no auth required)."""
    stmt = select(models.Memory).filter(models.Memory.id == memory_id)
    result = await db.execute(stmt)
    memory = result.scalar_one_or_none()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    memory.likes_count = (memory.likes_count or 0) + 1
    await db.commit()
    await db.refresh(memory)
    return {"likes_count": memory.likes_count}
