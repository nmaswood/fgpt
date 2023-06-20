from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    host: str = Field(env="host")
    port: int = Field(env="port")
    openai_api_key: str = Field(env="OPENAI_API_KEY")
    pinecone_api_key: str = Field(env="PINECONE_API_KEY")
    pinecone_env: str = Field(env="PINECONE_ENV")
    pinecone_index: str = Field(env="PINECONE_INDEX")
    pinecone_namespace: str = Field(env="PINECONE_NAMESPACE")
    telemetry_enabled: bool = Field(env="TRACING_ENABLED", default=False)
    reload:  bool = Field(env="RELOAD", default=False)

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'


SETTINGS = Settings()
