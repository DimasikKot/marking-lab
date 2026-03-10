from pydantic import BaseModel


class EchoResponse(BaseModel):
    detail: str
    status: str = "success"


class MLPostRequest(BaseModel):
    text: str


class MLPostResponse(BaseModel):
    words: list[str]
