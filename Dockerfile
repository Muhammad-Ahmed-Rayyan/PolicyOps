FROM python:3.12-slim

WORKDIR /app

# System deps needed for xgboost/shap compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY api/ ./api/
COPY src/ ./src/

# Model artifacts and MLflow tracking data needed to load the champion model
COPY models/ ./models/
COPY mlruns/ ./mlruns/
COPY mlflow.db ./mlflow.db

# Run as non-root user (good practice regardless of platform)
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Default port for local/manual runs; platforms like Render override
# this automatically via their own $PORT env var at runtime
EXPOSE 8000
ENV PORT=8000

CMD uvicorn api.main:app --host 0.0.0.0 --port ${PORT}