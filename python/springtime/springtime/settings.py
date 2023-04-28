from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    host: str = Field(env="host")
    port: int = Field(env="port")
    openai_api_key: str = Field(env="OPENAI_API_KEY")

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'


SETTINGS = Settings()
