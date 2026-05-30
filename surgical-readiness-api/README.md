# Surgical Readiness Agent API (Hackathon Demo)

Production-style FastAPI backend for a **Surgical Readiness Agent** using **synthetic healthcare data only**.

## Safety Notice

- This project is a demo and does **not** integrate with real EHR systems.
- All patient/surgery records are synthetic and non-PHI.

## Tech Stack

- Python 3.11+
- FastAPI
- Pydantic
- Uvicorn
- In-memory mock data store

## Project Structure

```text
.
├── app
│   ├── __init__.py
│   ├── data.py
│   ├── main.py
│   ├── models.py
│   ├── routes.py
│   └── services.py
├── tests
│   └── test_readiness.py
├── requirements.txt
└── README.md
```

## Setup

```bash
cd /Users/chhavisharma/surgical-readiness-api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open docs:
- Swagger UI: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

## Run Tests

```bash
pytest -q
```

## API Overview

Implemented endpoints:

- `GET /health`
- `GET /api/surgeries/tomorrow`
- `GET /api/patients/{patient_id}`
- `GET /api/patients/{patient_id}/surgical-readiness`
- `POST /api/search-policy`
- `POST /api/readiness/check`
- `POST /api/tasks`
- `GET /api/tasks`
- `POST /api/notify`
- `GET /api/notifications`
- `GET /api/readiness-dashboard`
- `POST /api/briefing/generate`
- `POST /api/workflows/run-preop-check`
- `GET /api/demo/story`

## Demo Workflow

`POST /api/workflows/run-preop-check` simulates an end-to-end agent loop:

1. Pull tomorrow's surgeries.
2. Run deterministic readiness checks.
3. Create one task per missing requirement.
4. Send mock team notifications for `AT_RISK`/`NOT_READY` patients.
5. Return workflow summary with per-case results.

## Curl Examples

1. List tomorrow's surgeries:

```bash
curl -s http://localhost:8000/api/surgeries/tomorrow | jq
```

2. Check readiness for one patient/surgery:

```bash
curl -s -X POST http://localhost:8000/api/readiness/check \
  -H "Content-Type: application/json" \
  -d '{"patient_id":"P001","surgery_id":"S001"}' | jq
```

3. Run the full agentic pre-op workflow:

```bash
curl -s -X POST http://localhost:8000/api/workflows/run-preop-check | jq
```

4. List generated tasks:

```bash
curl -s "http://localhost:8000/api/tasks" | jq
```

5. List sent mock notifications:

```bash
curl -s http://localhost:8000/api/notifications | jq
```

## Sample Synthetic Scenarios Included

- Fully ready patient
- Patient missing labs
- Patient missing consents
- Patient on Warfarin with missing anticoagulation plan
- High-risk patient missing cardiology clearance
