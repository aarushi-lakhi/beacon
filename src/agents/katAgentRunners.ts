import { run } from "@openai/agents";
import { briefingAgent } from "./briefingAgent";
import { coordinationAgent } from "./coordinationAgent";
import { db } from "@/lib/db";
import {
  AgentTrace,
  BeaconRunResult,
  CoordinationAction,
  MissingItem,
  ReadinessResult,
  SurgicalBriefing,
} from "@/lib/types";
import demoResults from "@/data/demo-results.json";

export interface AgentRunOptions {
  useDemoFixture?: boolean;
}

export interface CoordinationRunResult {
  caseId: string;
  agent: "Care Coordinator";
  mode: "demo" | "live" | "fallback";
  actions: CoordinationAction[];
  traces: AgentTrace[];
}

export interface BriefingRunResult {
  caseId: string;
  agent: "Briefing Generator";
  mode: "demo" | "live" | "fallback";
  briefing: SurgicalBriefing;
  traces: AgentTrace[];
}

export function isDemoMode(): boolean {
  return (
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === "sk-your-key-here" ||
    process.env.BEACON_MODE === "demo"
  );
}

export function getDemoReadiness(caseId: string): ReadinessResult | null {
  const demo = demoResults as BeaconRunResult;
  return demo.results[caseId]?.readiness ?? null;
}

export function getDemoCoordination(caseId: string): CoordinationRunResult | null {
  const demo = demoResults as BeaconRunResult;
  const result = demo.results[caseId];
  if (!result) return null;

  return {
    caseId,
    agent: "Care Coordinator",
    mode: "demo",
    actions: result.actions,
    traces: result.traces.filter((trace) =>
      ["Care Coordinator", "Coordination Agent"].includes(trace.agentName)
    ),
  };
}

export function getDemoBriefing(caseId: string): BriefingRunResult | null {
  const demo = demoResults as BeaconRunResult;
  const result = demo.results[caseId];
  if (!result) return null;

  return {
    caseId,
    agent: "Briefing Generator",
    mode: "demo",
    briefing: result.briefing,
    traces: result.traces.filter((trace) =>
      ["Briefing Generator", "Briefing Agent"].includes(trace.agentName)
    ),
  };
}

export async function runCareCoordinator(
  caseId: string,
  readiness: ReadinessResult,
  options: AgentRunOptions = {}
): Promise<CoordinationRunResult> {
  if (options.useDemoFixture) {
    const demo = getDemoCoordination(caseId);
    if (demo) return demo;
  }

  if (isDemoMode()) {
    return createFallbackCoordination(caseId, readiness, "fallback");
  }

  const start = Date.now();
  const result = await run(
    coordinationAgent,
    `Create coordination actions for case ${caseId}.
Readiness status: ${readiness.status} (score: ${readiness.score}/100).
Missing items: ${JSON.stringify(readiness.missingItems)}
Reasoning: ${readiness.reasoning}

Use get_case and get_patient before writing actions.
Return only a valid JSON array of CoordinationAction objects.`
  );

  const trace = createTrace(
    "Care Coordinator",
    "create_coordination_actions",
    `${caseId} - ${readiness.status}`,
    result.finalOutput ?? "Actions created",
    start
  );

  const actions = parseActions(result.finalOutput);
  if (actions.length === 0 && readiness.status !== "ready") {
    const fallback = createFallbackCoordination(caseId, readiness, "fallback");
    return { ...fallback, traces: [trace, ...fallback.traces] };
  }

  return {
    caseId,
    agent: "Care Coordinator",
    mode: "live",
    actions,
    traces: [trace],
  };
}

export async function runBriefingGenerator(
  caseId: string,
  readiness: ReadinessResult,
  options: AgentRunOptions = {}
): Promise<BriefingRunResult> {
  if (options.useDemoFixture) {
    const demo = getDemoBriefing(caseId);
    if (demo) return demo;
  }

  if (isDemoMode()) {
    return createFallbackBriefing(caseId, readiness, "fallback");
  }

  const start = Date.now();
  const result = await run(
    briefingAgent,
    `Generate a pre-operative briefing for case ${caseId}.
Readiness score: ${readiness.score}/100, status: ${readiness.status}.
Outstanding items: ${JSON.stringify(readiness.missingItems)}

Use your tools to retrieve all case and patient data.
Return only valid JSON matching the SurgicalBriefing type.`
  );

  const trace = createTrace(
    "Briefing Generator",
    "generate_briefing",
    `${caseId} - score ${readiness.score}`,
    result.finalOutput ?? "Briefing generated",
    start
  );

  const briefing = parseBriefing(result.finalOutput);
  if (!briefing) {
    const fallback = createFallbackBriefing(caseId, readiness, "fallback");
    return { ...fallback, traces: [trace, ...fallback.traces] };
  }

  return {
    caseId,
    agent: "Briefing Generator",
    mode: "live",
    briefing: normalizeBriefing(caseId, briefing, readiness),
    traces: [trace],
  };
}

function createFallbackCoordination(
  caseId: string,
  readiness: ReadinessResult,
  mode: "fallback"
): CoordinationRunResult {
  const start = Date.now();
  const surgicalCase = db.getCase(caseId);
  const patient = db.getPatient(surgicalCase?.patientId ?? readiness.patientId);
  const actions =
    readiness.status === "ready"
      ? []
      : readiness.missingItems.map((item, index) =>
          buildAction(caseId, readiness, item, index, patient?.name, patient?.mrn)
        );

  return {
    caseId,
    agent: "Care Coordinator",
    mode,
    actions,
    traces: [
      createTrace(
        "Care Coordinator",
        "create_coordination_actions",
        `${caseId} - ${readiness.status}`,
        actions.length === 0
          ? "No unresolved readiness issues; no coordination actions needed."
          : `Created ${actions.length} coordination action(s).`,
        start
      ),
    ],
  };
}

function createFallbackBriefing(
  caseId: string,
  readiness: ReadinessResult,
  mode: "fallback"
): BriefingRunResult {
  const start = Date.now();
  const surgicalCase = db.getCase(caseId);
  const patient = db.getPatient(surgicalCase?.patientId ?? readiness.patientId);
  const labs = db.getLabsForPatient(patient?.id ?? readiness.patientId);
  const imaging = db.getImagingForPatient(patient?.id ?? readiness.patientId);
  const clearances = db.getClearancesForPatient(patient?.id ?? readiness.patientId);

  const outstandingItems = readiness.missingItems.map((item) => item.name);
  const completedLabs = labs
    .filter((lab) => lab.status === "completed" && !lab.isExpired)
    .map((lab) => lab.type);
  const currentImaging = imaging
    .filter((study) => study.status === "completed" && !study.isExpired)
    .map((study) => study.type);
  const pendingClearances = clearances
    .filter((clearance) => clearance.status !== "cleared")
    .map((clearance) => `${clearance.specialty} ${clearance.status}`);

  const keyRisks = [
    ...(patient?.allergies ?? []).map((allergy) => `Allergy: ${allergy}`),
    ...(patient?.comorbidities ?? []).slice(0, 3),
    ...pendingClearances,
    ...outstandingItems.slice(0, 2).map((item) => `Outstanding: ${item}`),
  ].slice(0, 5);

  const anesthesiaConsiderations = [
    `${surgicalCase?.anesthesiaType ?? "General"} anesthesia planned`,
    ...(patient?.allergies ?? []).map((allergy) => `Avoid exposure related to ${allergy}`),
    readiness.status === "blocked"
      ? "Do not proceed until blocking readiness items are resolved"
      : "Confirm readiness status during pre-op huddle",
  ].slice(0, 5);

  const briefing: SurgicalBriefing = {
    caseId,
    patientName: patient?.name ?? "Unknown patient",
    procedure: surgicalCase?.procedure ?? "Unknown procedure",
    surgeon: surgicalCase?.surgeon ?? "Unknown surgeon",
    startTime: surgicalCase?.startTime ?? "00:00",
    estimatedDuration: surgicalCase?.estimatedDuration ?? 0,
    keyRisks: keyRisks.length > 0 ? keyRisks : ["No major unresolved risks identified"],
    outstandingItems,
    readinessScore: readiness.score,
    readinessStatus: readiness.status,
    anesthesiaConsiderations,
    summary: buildBriefingSummary(
      readiness,
      patient?.name ?? "The patient",
      surgicalCase?.procedure ?? "the scheduled procedure",
      completedLabs,
      currentImaging,
      outstandingItems
    ),
    generatedAt: new Date().toISOString(),
  };

  return {
    caseId,
    agent: "Briefing Generator",
    mode,
    briefing,
    traces: [
      createTrace(
        "Briefing Generator",
        "generate_briefing",
        `${caseId} - score ${readiness.score}`,
        `Generated briefing for ${briefing.patientName}.`,
        start
      ),
    ],
  };
}

function buildAction(
  caseId: string,
  readiness: ReadinessResult,
  item: MissingItem,
  index: number,
  patientName = "Unknown patient",
  mrn = "Unknown MRN"
): CoordinationAction {
  const surgicalCase = db.getCase(caseId);
  const critical = item.severity === "critical";
  const targetByType: Record<MissingItem["type"], string> = {
    lab: "Pre-Op Nursing Team",
    imaging: "Radiology Coordinator",
    consent: item.name.includes("Anesthesia") ? "Anesthesia Team" : "Surgical Coordinator",
    clearance: `${item.name.replace(" Clearance", "")} Team`,
  };
  const typeByItem: Record<MissingItem["type"], CoordinationAction["type"]> = {
    lab: "create_ticket",
    imaging: "escalate",
    consent: "escalate",
    clearance: "send_reminder",
  };

  return {
    id: `ACT-${caseId}-${index + 1}`,
    caseId,
    type: critical ? "escalate" : typeByItem[item.type],
    target: targetByType[item.type],
    message: `${critical ? "URGENT: " : ""}${item.name} is unresolved for ${patientName} (${mrn}), ${surgicalCase?.procedure ?? "scheduled procedure"} in ${surgicalCase?.orRoom ?? "assigned OR"} at ${surgicalCase?.startTime ?? "scheduled time"}. ${item.description} Resolve before case start and update the readiness dashboard.`,
    priority: critical ? "critical" : readiness.status === "at-risk" ? "high" : "medium",
    status: "sent",
    createdAt: new Date().toISOString(),
  };
}

function buildBriefingSummary(
  readiness: ReadinessResult,
  patientName: string,
  procedure: string,
  completedLabs: string[],
  currentImaging: string[],
  outstandingItems: string[]
): string {
  const readinessSentence =
    readiness.status === "ready"
      ? "The case is ready to proceed."
      : readiness.status === "blocked"
        ? "The case cannot proceed until blocking items are resolved."
        : "The case is at risk and requires follow-up before proceeding.";

  return `${patientName} is scheduled for ${procedure}. Readiness score is ${readiness.score}/100. ${readinessSentence} Completed labs: ${completedLabs.join(", ") || "none documented"}. Current imaging: ${currentImaging.join(", ") || "none documented"}. Outstanding items: ${outstandingItems.join(", ") || "none"}.`;
}

function createTrace(
  agentName: AgentTrace["agentName"],
  action: string,
  input: string,
  output: string,
  start: number
): AgentTrace {
  return {
    agentName,
    action,
    input,
    output,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - start,
  };
}

function parseActions(output?: string | null): CoordinationAction[] {
  if (!output) return [];
  try {
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? (parsed as CoordinationAction[]) : [];
  } catch {
    return [];
  }
}

function parseBriefing(output?: string | null): SurgicalBriefing | null {
  if (!output) return null;
  try {
    const parsed = JSON.parse(output);
    if (parsed && typeof parsed === "object") return parsed as SurgicalBriefing;
    return null;
  } catch {
    return null;
  }
}

function normalizeBriefing(
  caseId: string,
  briefing: SurgicalBriefing,
  readiness: ReadinessResult
): SurgicalBriefing {
  const surgicalCase = db.getCase(caseId);
  const patient = db.getPatient(surgicalCase?.patientId ?? readiness.patientId);

  return {
    ...briefing,
    caseId,
    patientName: briefing.patientName ?? patient?.name ?? "Unknown patient",
    procedure: briefing.procedure ?? surgicalCase?.procedure ?? "Unknown procedure",
    surgeon: briefing.surgeon ?? surgicalCase?.surgeon ?? "Unknown surgeon",
    startTime: briefing.startTime ?? surgicalCase?.startTime ?? "00:00",
    estimatedDuration: briefing.estimatedDuration ?? surgicalCase?.estimatedDuration ?? 0,
    keyRisks: briefing.keyRisks ?? [],
    outstandingItems:
      briefing.outstandingItems ?? readiness.missingItems.map((item) => item.name),
    readinessScore: readiness.score,
    readinessStatus: readiness.status,
    anesthesiaConsiderations: briefing.anesthesiaConsiderations ?? [],
    summary: briefing.summary ?? readiness.reasoning,
    generatedAt: briefing.generatedAt ?? new Date().toISOString(),
  };
}
