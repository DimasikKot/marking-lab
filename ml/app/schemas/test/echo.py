from pydantic import BaseModel


class EchoResponse(BaseModel):
    detail: str
    status: str = "success"


class PostRequest(BaseModel):
    text: str


class PostResponse(BaseModel):
    words: list[str]
