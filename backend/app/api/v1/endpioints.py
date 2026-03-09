from fastapi import APIRouter
from app.api.v1.routers.auth import user as auth_user

api_router = APIRouter()

api_router.include_router(auth_user.router, prefix="/auth/users", tags=["Auth Users"])
