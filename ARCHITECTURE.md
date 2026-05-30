# Beacon Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        BEACON PLATFORM                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   NEXT.JS APPLICATION                 │   │
│  │                                                       │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │   │
│  │  │ OR       │  │ Readiness    │  │ Case Detail   │  │   │
│  │  │ Schedule │  │ Command Ctr  │  │ + Briefing    │  │   │
│  │  └────┬─────┘  └──────┬───────┘  └───────┬───────┘  │   │
│  │       └───────────────┼──────────────────┘           │   │
│  │                       │ API Routes                    │   │
│  │  ┌────────────────────▼──────────────────────────┐   │   │
│  │  │              /api/run-beacon                   │   │   │
│  │  └────────────────────┬──────────────────────────┘   │   │
│  └───────────────────────┼───────────────────────────── ┘   │
│                          │                                   │
│  ┌───────────────────────▼─────────────────────────────┐   │
│  │                  AGENT ORCHESTRATOR                   │   │
│  │                                                       │   │
│  │  1. Schedule Monitor  →  Loads OR schedule           │   │
│  │         ↓                                             │   │
│  │  2. Readiness Reviewer →  Checks all requirements   │   │
│  │         ↓                                             │   │
│  │  3. Care Coordinator  →  Creates actions             │   │
│  │         ↓                                             │   │
│  │  4. Briefing Generator → Produces clinical summary   │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │ OpenAI Agents SDK                │
│  ┌───────────────────────▼─────────────────────────────┐   │
│  │                    AGENT TOOLS                        │   │
│  │                                                       │   │
│  │  get_or_schedule  │  get_patient  │  get_labs        │   │
│  │  get_imaging      │  get_consent  │  get_clearances   │   │
│  └───────────────────────┬─────────────────────────────┘   │
│                          │                                   │
│  ┌───────────────────────▼─────────────────────────────┐   │
│  │                  MOCK DATABASE (JSON)                 │   │
│  │                                                       │   │
│  │  patients.json    schedule.json    labs.json         │   │
│  │  imaging.json     clearances.json  consent.json      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Agent Architecture

### Agent SDK Usage

Each agent is an `Agent` instance from `@openai/agents`:

```typescript
const agent = new Agent({
  name: "Readiness Reviewer",
  instructions: "...",     // System prompt with clinical logic
  model: "gpt-4o",
  tools: [getTool, ...],   // Function calling tools
});

const result = await run(agent, input);
```

### Tool Calling Pattern

```typescript
const tool = tool({
  name: "get_labs",
  description: "...",
  parameters: z.object({ patientId: z.string() }),
  execute: async ({ patientId }) => {
    return JSON.stringify(db.getLabsForPatient(patientId));
  },
});
```

### Orchestration Flow (per case)

```
For each case in tomorrow's schedule:
  1. scheduleAgent.run("Load schedule")          → Case list
  2. readinessAgent.run("Check case {id}")       → ReadinessResult
  3. coordinationAgent.run("Create actions")     → CoordinationAction[]
  4. briefingAgent.run("Generate briefing")      → SurgicalBriefing
  
Collect all traces → BeaconRunResult
```

## Data Model

### Core Types

```typescript
ReadinessResult {
  caseId: string
  status: "ready" | "at-risk" | "blocked"
  score: 0-100
  reasoning: string
  missingItems: MissingItem[]
}

CoordinationAction {
  type: "escalate" | "notify_surgeon" | "notify_nurse" | ...
  target: string
  message: string
  priority: "critical" | "high" | "medium"
}

SurgicalBriefing {
  keyRisks: string[]
  outstandingItems: string[]
  anesthesiaConsiderations: string[]
  summary: string
}
```

## Demo Mode

When `OPENAI_API_KEY` is not set, the orchestrator returns pre-computed results from `demo-results.json`. This ensures:
- Zero API cost during demos
- Deterministic, reliable behavior
- Sub-second response time for "Run Beacon"
- Full agent traces visible in UI

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/schedule` | GET | Tomorrow's OR schedule + patient data |
| `/api/cases/[id]` | GET | Full case detail with readiness/actions/briefing |
| `/api/run-beacon` | POST | Trigger full multi-agent pipeline |
| `/api/agents/coordinator` | POST | Run Kat's Care Coordinator agent for one case |
| `/api/agents/briefing-generator` | POST | Run Kat's Briefing Generator agent for one case |
| `/api/metrics` | GET | Executive KPI summary |
