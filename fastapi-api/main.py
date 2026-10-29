import os
from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Lab 11 FastAPI")

@app.get("/")
def home():
    return {"message": os.getenv("APP_MESSAGE", "Hello from local FastAPI"), "lab": 111}

@app.get("/health")
def health():
    return {"status": "ok", "framework": "fastapi"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
