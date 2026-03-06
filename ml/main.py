import spacy
from pydantic import BaseModel
from fastapi import FastAPI

print(f"SpaCy version: {spacy.__version__}")

class TextRequest(BaseModel):
    text: str

app = FastAPI()

@app.get("/")
def root():
    return {"status": "ml worker running"}

@app.post("/process")
def process(request: TextRequest):
    return {
        "tokens": [t for t in [request.text]]
    }
