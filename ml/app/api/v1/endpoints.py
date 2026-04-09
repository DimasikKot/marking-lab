from fastapi import APIRouter
from app.api.v1.routers import echo, model


api_router: APIRouter = APIRouter()


api_router.include_router(echo.router, prefix="/echos", tags=["Echos"])
api_router.include_router(model.router, prefix="/models", tags=["Models"])