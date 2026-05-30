# Beacon Demo Script

## Setup (30 seconds before demo)

```bash
cd beacon
npm install
npm run dev
```

Open http://localhost:3000

---

## Demo Flow (~5 minutes)

### 1. OR Schedule View (60 seconds)

**Say:** "Beacon is monitoring tomorrow's OR schedule. It's 5:45 AM, and the surgical team is about to start their day."

- Point to the date header — tomorrow's date
- Show the full table: 15 cases, mixed statuses
- Point to the 4 demo cases highlighted in blue
- **Click "Run Beacon Analysis"**
- Watch the loading state — "Schedule Monitor → Readiness Reviewer → Care Coordinator → Briefing Generator"
- After completion, the table populates with scores and status badges

**Key talking point:** "In under 60 seconds, Beacon reviewed all 15 cases, caught every readiness gap, and dispatched 14 coordination actions — before a single surgeon walked in."

---

### 2. Readiness Command Center (60 seconds)

**Navigate to: Readiness Center**

**Say:** "This is the command center view. The OR coordinator can see at a glance which cases are clear and which need immediate attention."

- Show three columns: **9 Ready | 4 At Risk | 2 Blocked**
- Highlight the blocked cases in red — "These two cannot go to the OR today"
- Show the Agent Activity Feed on the right — scroll through it
- Point to specific agent names: "The Readiness Reviewer caught that Patricia Williams has no CBC and unsigned consent. The Care Coordinator immediately dispatched escalations."

---

### 3. Case Detail: CASE-003 — Blocked (90 seconds)

**Click on Patricia Williams (CASE-003)**

**Say:** "Let's look at why this case is blocked."

- Show the patient header: **Score 23/100 — BLOCKED** badge in red
- Show missing items section:
  - "CBC — never ordered, despite documented anemia. This is a hard stop."
  - "Coagulation panel — missing for a major gynecologic oncology surgery"
  - "Both surgical AND anesthesia consent forms — unsigned. Patient never came to pre-op clinic."
- Scroll to Coordination Actions:
  - Escalation to Dr. Elena Patel: "CASE BLOCKED — three critical items missing, please contact patient immediately"
  - Pre-op coordinator notified
  - OR scheduling held the OR-2 slot for contingency

**Click "Surgical Briefing" tab:**
- Show the clinical narrative — written in medical language
- "Beacon generated this in under 3 seconds. A pre-op coordinator would typically spend 20-30 minutes writing this."

**Click "Agent Traces" tab:**
- Show the step-by-step agent reasoning:
  - "CBC MISSING — never ordered"
  - "Consent MISSING — patient never completed pre-op visit"
  - "Score: 23/100 — BLOCKED"

---

### 4. Case Detail: CASE-002 — At Risk (60 seconds)

**Navigate back, click Robert Martinez (CASE-002)**

**Say:** "This is a more nuanced case — not fully blocked, but at risk."

- Show **Score 62/100 — AT RISK**
- Show the single missing item: "Cardiology clearance — pending since 3 days ago. Patient has CAD and needs clearance before THA."
- Show the escalation action: "Beacon messaged cardiology directly — 'Required before 06:00 tomorrow'"
- "If clearance comes in overnight, this case proceeds on time. If not, Dr. Torres has already been notified to activate his contingency plan."

---

### 5. Case Detail: CASE-001 — Fully Ready (30 seconds)

**Click Margaret Chen (CASE-001)**

**Say:** "And this is what success looks like."

- Show **Score 97/100 — READY**
- No missing items — "All requirements met" green banner
- No coordination actions needed
- Show the briefing — clean, concise surgical summary

"Margaret's surgery starts at 7:30. Her team walks in knowing everything is in order."

---

### 6. Executive Metrics (30 seconds)

**Navigate to Executive Metrics**

**Say:** "For hospital leadership, Beacon surfaces the business impact."

- Point to: **Cancellation Risk 22%** — "Two cases can't proceed, the system caught it early enough to fix"
- Point to: **OR Time Protected: 120 minutes** — "Early detection means rescheduling can happen, not last-minute cancellation"
- Point to: **14 Actions Dispatched** — "Fully automated. Zero manual effort from the OR coordinator."
- Show the cost savings: "~$7,440 in estimated OR cost protected"

---

## Key Messages

1. **Speed:** 47 seconds to review 15 cases. A human team takes hours.
2. **Completeness:** Beacon checks every case, every time. No manual gaps.
3. **Clinical precision:** Agents understand protocol rules (e.g., TAVR requires cardiac cath <90 days).
4. **Actionable:** Every issue triggers an appropriate action — not just an alert.
5. **Explainable:** Every decision is traced and visible in the UI.

---

## Technical Questions

**"How does the AI know the clinical rules?"**
> The Readiness Reviewer agent is given detailed clinical instructions: specific lab validity windows, procedure-specific requirements, severity scoring. It uses tool calls to fetch patient data from the mock database and applies these rules.

**"What if there's no API key?"**
> Beacon runs in demo mode using pre-computed results. Same UI, same experience — the agents already ran, and their outputs are stored. In production, agents run on each review cycle.

**"How would this integrate with real EHR systems?"**
> The agent tools currently call a mock JSON database. In production, each tool would call the EHR API (Epic, Cerner) or document management system. The agent logic doesn't change.

**"Can Beacon actually send messages?"**
> In this demo, Coordination Agent generates messages and marks them as "sent." In production, actions connect to Epic In Basket, Slack, PagerDuty, or the hospital's paging system.
