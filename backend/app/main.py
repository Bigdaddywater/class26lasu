from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

from app.api.v1.api import api_router
from app.core.config import settings
from app.database.session import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LASU 2026 Digital Archive API",
    description="Enterprise-grade backend for the Echelontix ecosystem",
    version="1.0.0",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Welcome to the LASU 2026 Digital Archive API",
        "engine": "Echelontix Premium"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=3000, reload=True)
