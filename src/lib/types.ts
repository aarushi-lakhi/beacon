export interface Patient {
  id: string;
  name: string;
  mrn: string;
  dob: string;
  age: number;
  gender: "M" | "F";
  bloodType: string;
  bmi: number;
  allergies: string[];
  comorbidities: string[];
}

export interface SurgicalCase {
  id: string;
  patientId: string;
  procedure: string;
  surgeon: string;
  anesthesiologist: string;
  orRoom: string;
  date: string;
  startTime: string;
  estimatedDuration: number;
  anesthesiaType: "General" | "Regional" | "MAC" | "Spinal";
  priority: "elective" | "urgent" | "emergent";
  demoHighlight?: boolean;
  demoLabel?: string;
}

export interface EnrichedSurgicalCase extends SurgicalCase {
  patient: Patient | null;
}

export type HospitalCalendarCategory =
  | "or_block"
  | "maintenance"
  | "equipment"
  | "staffing"
  | "operations";

export interface HospitalCalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: HospitalCalendarCategory;
  orRoom: string | null;
  status: "active" | "planned";
  notes: string;
}

export type ScheduleConflictType =
  | "or_room_unavailable"
  | "surgeon_overlap"
  | "anesthesiologist_overlap";

export interface ScheduleConflict {
  id: string;
  type: ScheduleConflictType;
  severity: "warning" | "critical";
  message: string;
  caseIds: string[];
  relatedEventId: string | null;
}

export interface ScheduleApiResponse {
  date: string;
  surgeryCalendar: EnrichedSurgicalCase[];
  hospitalCalendar: HospitalCalendarEvent[];
  conflicts: ScheduleConflict[];
  // Backward-compatible alias for existing frontend code.
  cases: EnrichedSurgicalCase[];
}

export interface LabResult {
  id: string;
  patientId: string;
  type: string;
  status: "completed" | "missing" | "expired";
  orderedDate: string | null;
  resultDate: string | null;
  expirationDate: string | null;
  isExpired: boolean;
  values: Record<string, number | string> | null;
}

export interface ImagingResult {
  id: string;
  patientId: string;
  type: string;
  status: "completed" | "missing" | "expired";
  date: string | null;
  expirationDate: string | null;
  isExpired: boolean;
  findings: string | null;
}

export interface Clearance {
  id: string;
  patientId: string;
  specialty: string;
  status: "cleared" | "pending" | "missing";
  requestedDate: string | null;
  receivedDate: string | null;
  notes: string | null;
}

export interface ConsentForm {
  id: string;
  patientId: string;
  type: "Surgical" | "Anesthesia";
  status: "signed" | "missing";
  signedDate: string | null;
  signedBy: string | null;
}

export type ReadinessStatus = "ready" | "at-risk" | "blocked";

export interface MissingItem {
  type: "lab" | "imaging" | "consent" | "clearance";
  name: string;
  severity: "critical" | "warning";
  description: string;
}

export interface ReadinessResult {
  caseId: string;
  patientId: string;
  status: ReadinessStatus;
  score: number;
  reasoning: string;
  missingItems: MissingItem[];
  checkedAt: string;
}

export interface CoordinationAction {
  id: string;
  caseId: string;
  type: "notify_surgeon" | "notify_nurse" | "notify_anesthesia" | "create_ticket" | "escalate" | "send_reminder";
  target: string;
  message: string;
  priority: "critical" | "high" | "medium";
  status: "sent" | "pending" | "resolved";
  createdAt: string;
}

export interface SurgicalBriefing {
  caseId: string;
  patientName: string;
  procedure: string;
  surgeon: string;
  startTime: string;
  estimatedDuration: number;
  keyRisks: string[];
  outstandingItems: string[];
  readinessScore: number;
  readinessStatus: ReadinessStatus;
  anesthesiaConsiderations: string[];
  summary: string;
  generatedAt: string;
}

export interface AgentTrace {
  agentName: string;
  action: string;
  input: string;
  output: string;
  timestamp: string;
  durationMs: number;
}

export interface CaseDetail {
  case: SurgicalCase;
  patient: Patient;
  labs: LabResult[];
  imaging: ImagingResult[];
  clearances: Clearance[];
  consent: ConsentForm[];
  readiness: ReadinessResult | null;
  actions: CoordinationAction[];
  briefing: SurgicalBriefing | null;
  traces: AgentTrace[];
}

export interface BeaconRunResult {
  runId: string;
  startedAt: string;
  completedAt: string;
  casesProcessed: number;
  readyCases: number;
  atRiskCases: number;
  blockedCases: number;
  totalActions: number;
  results: {
    [caseId: string]: {
      readiness: ReadinessResult;
      actions: CoordinationAction[];
      briefing: SurgicalBriefing;
      traces: AgentTrace[];
    };
  };
}

export interface ExecutiveMetrics {
  totalCasesTomorrow: number;
  casesReviewed: number;
  readyCases: number;
  atRiskCases: number;
  blockedCases: number;
  cancellationRiskPercent: number;
  issuesResolved: number;
  estimatedORTimeSavedMinutes: number;
  actionsSent: number;
  lastRunAt: string | null;
}
