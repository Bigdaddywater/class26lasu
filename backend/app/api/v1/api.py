from fastapi import APIRouter
from app.api.v1.endpoints import memories, auth

api_router = APIRouter()
api_router.include_router(memories.router, prefix="/memories", tags=["memories"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Future routes to be added
# api_router.include_router(events.router, prefix="/events", tags=["events"])
