import { run } from "@openai/agents";
import { scheduleAgent } from "./scheduleAgent";
import { readinessAgent } from "./readinessAgent";
import { coordinationAgent } from "./coordinationAgent";
import { briefingAgent } from "./briefingAgent";
import { db } from "@/lib/db";
import {
  ReadinessResult,
  CoordinationAction,
  SurgicalBriefing,
  AgentTrace,
  BeaconRunResult,
} from "@/lib/types";
import demoResults from "@/data/demo-results.json";

function isDemoMode(): boolean {
  return (
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === "sk-your-key-here" ||
    process.env.BEACON_MODE === "demo"
  );
}

function now(): string {
  return new Date().toISOString();
}

async function runReadinessCheck(caseId: string): Promise<{
  readiness: ReadinessResult;
  traces: AgentTrace[];
}> {
  const start = Date.now();
  const traces: AgentTrace[] = [];

  const result = await run(
    readinessAgent,
    `Check surgical readiness for case ${caseId}. Use your tools to retrieve all patient data and assess readiness.`
  );

  traces.push({
    agentName: "Readiness Reviewer",
    action: "full_readiness_check",
    input: `Case ${caseId}`,
    output: result.finalOutput ?? "Readiness check complete",
    timestamp: now(),
    durationMs: Date.now() - start,
  });

  let readiness: ReadinessResult;
  try {
    readiness = JSON.parse(result.finalOutput ?? "{}");
  } catch {
    readiness = {
      caseId,
      patientId: "",
      status: "at-risk",
      score: 50,
      reasoning: result.finalOutput ?? "Unable to parse readiness result",
      missingItems: [],
      checkedAt: now(),
    };
  }

  return { readiness, traces };
}

async function runCoordination(
  caseId: string,
  readiness: ReadinessResult
): Promise<{ actions: CoordinationAction[]; traces: AgentTrace[] }> {
  if (readiness.status === "ready") {
    return { actions: [], traces: [] };
  }

  const start = Date.now();
  const traces: AgentTrace[] = [];

  const result = await run(
    coordinationAgent,
    `Create coordination actions for case ${caseId}.
Readiness status: ${readiness.status} (score: ${readiness.score}/100).
Missing items: ${JSON.stringify(readiness.missingItems)}
Reasoning: ${readiness.reasoning}

Use the tools to get case and patient details, then create specific actions for each missing item.`
  );

  traces.push({
    agentName: "Care Coordinator",
    action: "create_coordination_actions",
    input: `${caseId} — ${readiness.status}`,
    output: result.finalOutput ?? "Actions created",
    timestamp: now(),
    durationMs: Date.now() - start,
  });

  let actions: CoordinationAction[] = [];
  try {
    actions = JSON.parse(result.finalOutput ?? "[]");
    if (!Array.isArray(actions)) actions = [];
  } catch {
    actions = [];
  }

  return { actions, traces };
}

async function runBriefing(
  caseId: string,
  readiness: ReadinessResult
): Promise<{ briefing: SurgicalBriefing; traces: AgentTrace[] }> {
  const start = Date.now();
  const traces: AgentTrace[] = [];

  const result = await run(
    briefingAgent,
    `Generate a pre-operative briefing for case ${caseId}.
Readiness score: ${readiness.score}/100, status: ${readiness.status}.
Outstanding items: ${JSON.stringify(readiness.missingItems)}

Use your tools to retrieve all case and patient data, then produce the surgical briefing.`
  );

  traces.push({
    agentName: "Briefing Generator",
    action: "generate_briefing",
    input: `${caseId} — score ${readiness.score}`,
    output: result.finalOutput ?? "Briefing generated",
    timestamp: now(),
    durationMs: Date.now() - start,
  });

  let briefing: SurgicalBriefing;
  try {
    briefing = JSON.parse(result.finalOutput ?? "{}");
  } catch {
    const surgicalCase = db.getCase(caseId);
    const patient = db.getPatient(surgicalCase?.patientId ?? "");
    briefing = {
      caseId,
      patientName: patient?.name ?? "Unknown",
      procedure: surgicalCase?.procedure ?? "Unknown",
      surgeon: surgicalCase?.surgeon ?? "Unknown",
      startTime: surgicalCase?.startTime ?? "00:00",
      estimatedDuration: surgicalCase?.estimatedDuration ?? 0,
      keyRisks: [],
      outstandingItems: readiness.missingItems.map((m) => m.name),
      readinessScore: readiness.score,
      readinessStatus: readiness.status,
      anesthesiaConsiderations: [],
      summary: result.finalOutput ?? "Briefing unavailable",
      generatedAt: now(),
    };
  }

  return { briefing, traces };
}

export async function runBeaconAnalysis(): Promise<BeaconRunResult> {
  const runId = `BEACON-RUN-${Date.now()}`;
  const startedAt = now();

  if (isDemoMode()) {
    const demo = demoResults as BeaconRunResult;
    return {
      ...demo,
      runId,
      startedAt,
      completedAt: new Date(Date.now() + 47312).toISOString(),
    };
  }

  const cases = db.getTomorrowSchedule();
  const results: BeaconRunResult["results"] = {};

  const scheduleStart = Date.now();
  await run(
    scheduleAgent,
    "Load tomorrow's OR schedule and review all upcoming cases. Flag any urgent or emergent cases."
  );
  const scheduleTraceBase: AgentTrace = {
    agentName: "Schedule Monitor",
    action: "load_schedule",
    input: "tomorrow",
    output: `Loaded ${cases.length} cases`,
    timestamp: now(),
    durationMs: Date.now() - scheduleStart,
  };

  let readyCases = 0;
  let atRiskCases = 0;
  let blockedCases = 0;
  let totalActions = 0;

  for (const surgicalCase of cases) {
    const allTraces: AgentTrace[] = [scheduleTraceBase];

    const { readiness, traces: readinessTraces } = await runReadinessCheck(
      surgicalCase.id
    );
    allTraces.push(...readinessTraces);
    readiness.caseId = surgicalCase.id;
    readiness.patientId = surgicalCase.patientId;

    const { actions, traces: coordTraces } = await runCoordination(
      surgicalCase.id,
      readiness
    );
    allTraces.push(...coordTraces);

    const { briefing, traces: briefingTraces } = await runBriefing(
      surgicalCase.id,
      readiness
    );
    allTraces.push(...briefingTraces);
    briefing.caseId = surgicalCase.id;

    if (readiness.status === "ready") readyCases++;
    else if (readiness.status === "at-risk") atRiskCases++;
    else blockedCases++;

    totalActions += actions.length;

    results[surgicalCase.id] = { readiness, actions, briefing, traces: allTraces };
  }

  return {
    runId,
    startedAt,
    completedAt: now(),
    casesProcessed: cases.length,
    readyCases,
    atRiskCases,
    blockedCases,
    totalActions,
    results,
  };
}
