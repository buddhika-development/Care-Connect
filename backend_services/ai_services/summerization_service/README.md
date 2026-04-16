# Summarization Service (FastAPI)

Document summarization microservice for Care Connect. Uses [Docling](https://github.com/DS4SD/docling) to parse documents (PDF, DOCX, HTML, etc.) and Google Gemini to generate structured summaries.

## Setup

```bash
cp .env.example .env
# fill in your GOOGLE_API_KEY in .env

uv sync
```

## Run the server

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/` | Service status |
| `GET` | `/api/health` | Health check |
| `PATCH` | `/api/document/analyze` | Analyze and summarize a document |

## `PATCH /api/document/analyze`

**Request body:**

```json
{
  "document_id": "doc-123",
  "document_url": "https://arxiv.org/pdf/2408.09869"
}
```

**Response:**

```json
{
  "document_id": "doc-123",
  "summary": "## Objective\n..."
}
```

## API Docs

- Swagger UI: `http://127.0.0.1:8001/docs`
- ReDoc: `http://127.0.0.1:8001/redoc`
