# Beacon — AI Surgical Operations Platform

Beacon is a multi-agent AI platform that prevents day-of-surgery cancellations by continuously monitoring surgical readiness and coordinating follow-up actions across care teams.

> **Hackathon Demo Mode:** Works fully without an OpenAI API key using pre-computed agent results. Set `OPENAI_API_KEY` to run live agents.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---
   
## The Platform

Beacon acts like a lighthouse for surgical teams — it continuously watches upcoming surgeries, identifies readiness risks, coordinates follow-up actions, and generates concise surgical briefings.

### Agent Pipeline

```
Schedule Monitor → Readiness Reviewer → Care Coordinator → Briefing Generator
```

| Agent | Input | Output |
|---|---|---|
| Schedule Monitor | Tomorrow's date | List of upcoming OR cases |
| Readiness Reviewer | Case ID + patient data | Readiness score (0-100), status, missing items |
| Care Coordinator | Readiness result | Targeted notifications, escalations, tickets |
| Briefing Generator | Full case data | Clinical pre-operative briefing |

### Readiness Scoring

| Score | Status | Meaning |
|---|---|---|
| 85–100 | ✅ Ready | All requirements met, proceed |
| 50–84 | ⚠️ At Risk | Issues found, action dispatched, conditional proceed |
| 0–49 | 🚫 Blocked | Critical items missing, cannot proceed |

---

## Demo Scenarios

Four scripted cases demonstrate Beacon's full capabilities:

| Case | Patient | Procedure | Status | Score | Issue |
|---|---|---|---|---|---|
| CASE-001 | Margaret Chen | Laparoscopic Colectomy | ✅ Ready | 97 | None — all clear |
| CASE-002 | Robert Martinez | Total Hip Arthroplasty | ⚠️ At Risk | 62 | Cardiology clearance pending (CAD) |
| CASE-003 | Patricia Williams | Robotic Hysterectomy | 🚫 Blocked | 23 | Missing CBC + both consent forms |
| CASE-004 | James Thompson | TAVR | ⚠️ At Risk | 51 | Cardiac cath expired (122 days, limit 90) |

---

## Dashboard Pages

| Page | URL | Description |
|---|---|---|
| OR Schedule | `/` | All tomorrow's cases with readiness scores and Run Beacon button |
| Readiness Center | `/readiness` | Cases organized by Ready / At Risk / Blocked with agent activity feed |
| Case Detail | `/case/[id]` | Full case breakdown: labs, imaging, consent, actions, briefing, agent traces |
| Executive Metrics | `/metrics` | KPI dashboard, readiness distribution, weekly trends, business impact |

---

## Agent API Routes

Beacon exposes the full pipeline through `/api/run-beacon`, and individual agent routes for clear team ownership:

| Agent | Owner | Route | Purpose |
|---|---|---|---|
| Care Coordinator | Kat | `POST /api/agents/coordinator` | Turns readiness gaps into escalations, reminders, tickets, and team messages |
| Briefing Generator | Kat | `POST /api/agents/briefing-generator` | Produces the clinical pre-op briefing for a surgical case |

Example request:

```bash
curl -s -X POST http://localhost:3000/api/agents/coordinator \
  -H "Content-Type: application/json" \
  -d '{"caseId":"CASE-003"}'

curl -s -X POST http://localhost:3000/api/agents/briefing-generator \
  -H "Content-Type: application/json" \
  -d '{"caseId":"CASE-003"}'
```

If `readiness` is omitted, the routes use the demo readiness result for that case. To test custom readiness scenarios, include a `readiness` object in the request body.

---

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Recharts |
| Backend | Next.js API Routes, Node.js |
| AI Agents | OpenAI Agents SDK (`@openai/agents`) |
| AI Models | GPT-4o |
| Data | Mock JSON database (50 synthetic patients, no real PHI) |

---

## Environment Variables

```bash
# .env.local
OPENAI_API_KEY=sk-...   # Required for live agent runs
BEACON_MODE=demo        # Force demo mode (pre-computed results)
```

When `OPENAI_API_KEY` is not set or `BEACON_MODE=demo`, Beacon uses pre-computed results from `src/data/demo-results.json` — ensuring the demo always works reliably.

---

## Project Structure

```
src/
├── agents/
│   ├── scheduleAgent.ts      # Schedule Monitor
│   ├── readinessAgent.ts     # Readiness Reviewer
│   ├── coordinationAgent.ts  # Care Coordinator
│   ├── briefingAgent.ts      # Briefing Generator
│   ├── orchestrator.ts       # Pipeline orchestration + demo mode
│   └── tools.ts              # Shared agent tools
├── app/
│   ├── page.tsx              # OR Schedule view
│   ├── readiness/page.tsx    # Readiness Command Center
│   ├── case/[id]/page.tsx    # Case Detail
│   ├── metrics/page.tsx      # Executive Metrics
│   └── api/                  # API routes
├── components/               # Shared UI components
├── data/                     # Mock JSON database (50 patients)
└── lib/                      # Types, utils, DB access
```

---

## Mock Data

- **50 synthetic patients** with realistic demographics, comorbidities, and allergies
- **15 OR cases** for tomorrow's schedule
- **Labs, imaging, clearances, consent** records per case
- **GLIS-RT imaging adapter** mapped into Beacon patient IDs (`PT-001`..`PT-050`) for richer imaging context
- **Pre-computed agent results** with full readiness analysis, coordination actions, briefings, and agent traces

All data is synthetic — no real patient information.

### Optional: Rebuild GLIS-RT Derived Imaging Data

If you have an updated GLIS-RT NBIA manifest workbook, regenerate the derived imaging files with:

```bash
python3 scripts/build_glis_imaging_dataset.py \
  --input "/path/to/GLIS-RT-manifes-nbia-digest.xlsx" \
  --out-imaging src/data/glis-rt-imaging.json \
  --out-map src/data/glis-rt-patient-map.json
```

---

*Built with OpenAI Agents SDK for the OpenAI Business Hackathon (w/ The AI Collective).*
