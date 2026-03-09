from fastapi import APIRouter
from app.api.v1.routers.auth import user as auth_user
from app.api.v1.routers.test import echos as test_echos

api_router: APIRouter = APIRouter()

api_router.include_router(auth_user.router, prefix="/auth/users", tags=["Auth Users"])
api_router.include_router(test_echos.router, prefix="/test/echos", tags=["Test Echos"])
