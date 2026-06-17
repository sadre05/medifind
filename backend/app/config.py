from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    SYNC_DATABASE_URL: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # File Storage
    STORAGE_BACKEND: str = "local"
    LOCAL_UPLOAD_DIR: str = "./uploads"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_BUCKET_NAME: str = "medifind-prescriptions"
    AWS_REGION: str = "ap-northeast-1"

    # OCR
    OCR_BACKEND: str = "tesseract"
    OPENAI_API_KEY: str = ""

    # App
    APP_NAME: str = "MediFind"
    APP_ENV: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"
    REQUEST_EXPIRE_MINUTES: int = 30
    SEARCH_RADIUS_KM: float = 5.0

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()

