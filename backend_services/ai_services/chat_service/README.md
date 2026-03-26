# Chat Service (FastAPI)

## Run the server

```bash
uv sync
uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoints

- `GET /` returns a basic service status payload.
- `GET /health` returns a health check response.

## API docs

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
