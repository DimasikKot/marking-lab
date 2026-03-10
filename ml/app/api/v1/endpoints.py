from fastapi import APIRouter
from app.api.v1.routers import echo


api_router: APIRouter = APIRouter()


api_router.include_router(echo.router, prefix="/echos", tags=["Echos"])
