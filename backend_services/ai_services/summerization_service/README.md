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
| `PATCH` | `/api/document/analyze` | Analyze document, save document summary, and upsert user summary |
| `POST` | `/api/user/analyze` | Merge user summary and save it with upsert by `user_id` |
| `GET` | `/api/user/{user_id}/details` | Get stored user summary details (404 if not found) |

## `PATCH /api/document/analyze`

**Request body:**

```json
{
  "user_id": "c7ea34fd-14ba-4f2b-9902-f91177c511e5",
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

## `POST /api/user/analyze`

Creates or updates the persisted user summary in the database.

- If a row already exists for `user_id`, it is updated.
- If no row exists, a new row is created.

**Request body:**

```json
{
  "user_id": "c7ea34fd-14ba-4f2b-9902-f91177c511e5",
  "user_current_summary": "Patient has mild asthma and seasonal allergies.",
  "user_new_content": "Recent blood pressure readings are elevated."
}
```

`user_current_summary` is optional. If omitted, the service uses the currently stored summary for that user (if any).

**Response:**

```json
{
  "user_id": "c7ea34fd-14ba-4f2b-9902-f91177c511e5",
  "updated_summary": "Patient has mild asthma..."
}
```

## `GET /api/user/{user_id}/details`

Returns stored user summary details.

**Success (200):**

```json
{
  "id": "0f0a00f0-cfbe-4ea2-a18a-f3411f4a1e40",
  "user_id": "c7ea34fd-14ba-4f2b-9902-f91177c511e5",
  "user_summary": "Patient has mild asthma...",
  "created_datetime": "2026-04-17T08:17:47.123456+00:00",
  "updated_datetime": "2026-04-17T08:20:12.123456+00:00"
}
```

**Not found (404):**

```json
{
  "detail": "No user details found for user_id 'c7ea34fd-14ba-4f2b-9902-f91177c511e5'"
}
```
```

## API Docs

- Swagger UI: `http://127.0.0.1:8001/docs`
- ReDoc: `http://127.0.0.1:8001/redoc`
