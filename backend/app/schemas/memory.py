from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class MemoryBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    media_url: str
    media_type: str = "image"
    faculty: Optional[str] = None
    tags: Optional[str] = None
    category_id: Optional[int] = None

class MemoryCreate(MemoryBase):
    pass

class MemoryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    approved: Optional[bool] = None
    featured: Optional[bool] = None

class Memory(MemoryBase):
    id: int
    uploader_id: int
    views: int
    likes_count: int
    comments_count: int
    approved: bool
    featured: bool
    created_at: datetime

    class Config:
        from_attributes = True
