from pydantic import BaseModel


class UploadPostResponse(BaseModel):
    content: str