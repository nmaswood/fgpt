FROM python:3.11.4-slim AS base

ENV PYTHONFAULTHANDLER=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    PATH="$PATH:/runtime/bin" \
    PYTHONPATH="$PYTHONPATH:/runtime/lib/python3.11/site-packages"



# System deps:
RUN apt-get update && apt-get install -y build-essential unzip wget dumb-init openjdk-17-jre-headless && apt-get clean;


RUN pip install poetry

WORKDIR /src

# Generate requirements and install *all* dependencies.
COPY pyproject.toml poetry.lock /src/
RUN poetry export --dev --without-hashes --no-interaction --no-ansi -f requirements.txt -o requirements.txt
RUN pip install --prefix=/runtime --force-reinstall -r requirements.txt

COPY . /src
ENV HOST=0.0.0.0
ENV PORT=8080


ENTRYPOINT ["dumb-init", "--"]
CMD uvicorn springtime.main:app --port "$PORT" --host "$HOST"
