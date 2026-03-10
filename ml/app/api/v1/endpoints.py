from fastapi import APIRouter
from app.api.v1.routers.test import echo as test_echo


api_router: APIRouter = APIRouter()


api_router.include_router(test_echo.router, prefix="/test/echo", tags=["Test Echo"])
