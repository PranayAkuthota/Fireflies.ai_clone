from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Fireflies Clone API"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite+aiosqlite:///./fireflies.db"
    
    # Optional environment configurations for real LLM features
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
