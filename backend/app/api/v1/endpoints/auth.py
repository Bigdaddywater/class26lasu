from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import session
from app.models import models
from app.schemas import user as user_schemas
from app.core import security
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=user_schemas.UserRead)
async def register(
    *,
    db: AsyncSession = Depends(session.get_db),
    user_in: user_schemas.UserCreate
) -> Any:
    # Check if user with same email exists
    stmt = select(models.User).filter(models.User.email == user_in.email)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    # Check if user with same username exists
    stmt_username = select(models.User).filter(models.User.username == user_in.username)
    result_username = await db.execute(stmt_username)
    user_by_username = result_username.scalars().first()
    if user_by_username:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
        
    user = models.User(
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name,
        password_hash=security.get_password_hash(user_in.password),
        faculty=user_in.faculty,
        department=user_in.department,
        bio=user_in.bio
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

from fastapi.security import OAuth2PasswordRequestForm

@router.post("/login", response_model=user_schemas.Token)
async def login(
    *,
    db: AsyncSession = Depends(session.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    stmt = select(models.User).filter(models.User.username == form_data.username)
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        # Check by email as a fallback
        stmt_email = select(models.User).filter(models.User.email == form_data.username)
        result_email = await db.execute(stmt_email)
        user = result_email.scalars().first()
        
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
        
    return {
        "access_token": security.create_access_token(user.id),
        "token_type": "bearer",
    }
