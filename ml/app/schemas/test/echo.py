from pydantic import BaseModel


class EchoResponse(BaseModel):
    detail: str
    status: str = "success"


class MLRequest(BaseModel):
    text: str


class MLResponse(BaseModel):
    tokens: list[str]
