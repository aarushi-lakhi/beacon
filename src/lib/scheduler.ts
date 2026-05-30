import { db } from "./db";
import {
  EnrichedSurgicalCase,
  HospitalCalendarEvent,
  ScheduleApiResponse,
  ScheduleConflict,
  SurgicalCase,
} from "./types";
import { getTomorrowDate } from "./utils";

function normalizeRequestedDate(requestedDate?: string | null): string {
  if (!requestedDate || requestedDate.trim() === "") {
    return getTomorrowDate();
  }

  return requestedDate.toLowerCase() === "tomorrow"
    ? getTomorrowDate()
    : requestedDate;
}

function timeToMinutes(timeValue: string): number {
  const [hour, minute] = timeValue.split(":").map(Number);
  return hour * 60 + minute;
}

function overlaps(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && startB < endA;
}

function compareByStartTime(a: { startTime: string }, b: { startTime: string }): number {
  return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
}

function getCaseEndMinutes(surgicalCase: SurgicalCase): number {
  return timeToMinutes(surgicalCase.startTime) + surgicalCase.estimatedDuration;
}

function buildRoomCalendarConflicts(
  surgeryCalendar: EnrichedSurgicalCase[],
  hospitalCalendar: HospitalCalendarEvent[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  for (const surgicalCase of surgeryCalendar) {
    const caseStart = timeToMinutes(surgicalCase.startTime);
    const caseEnd = getCaseEndMinutes(surgicalCase);

    for (const event of hospitalCalendar) {
      if (!event.orRoom || event.orRoom !== surgicalCase.orRoom) {
        continue;
      }

      const eventStart = timeToMinutes(event.startTime);
      const eventEnd = timeToMinutes(event.endTime);

      if (!overlaps(caseStart, caseEnd, eventStart, eventEnd)) {
        continue;
      }

      conflicts.push({
        id: `CF-${surgicalCase.id}-${event.id}`,
        type: "or_room_unavailable",
        severity: event.status === "active" ? "critical" : "warning",
        message: `${surgicalCase.id} conflicts with ${event.title} in ${event.orRoom} (${event.startTime}-${event.endTime}).`,
        caseIds: [surgicalCase.id],
        relatedEventId: event.id,
      });
    }
  }

  return conflicts;
}

function buildClinicianOverlapConflicts(
  surgeryCalendar: EnrichedSurgicalCase[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  for (let indexA = 0; indexA < surgeryCalendar.length; indexA += 1) {
    for (let indexB = indexA + 1; indexB < surgeryCalendar.length; indexB += 1) {
      const caseA = surgeryCalendar[indexA];
      const caseB = surgeryCalendar[indexB];

      const caseAStart = timeToMinutes(caseA.startTime);
      const caseAEnd = getCaseEndMinutes(caseA);
      const caseBStart = timeToMinutes(caseB.startTime);
      const caseBEnd = getCaseEndMinutes(caseB);

      if (!overlaps(caseAStart, caseAEnd, caseBStart, caseBEnd)) {
        continue;
      }

      if (caseA.surgeon === caseB.surgeon) {
        conflicts.push({
          id: `CF-${caseA.id}-${caseB.id}-surgeon`,
          type: "surgeon_overlap",
          severity: "critical",
          message: `${caseA.surgeon} is double-booked between ${caseA.id} and ${caseB.id}.`,
          caseIds: [caseA.id, caseB.id],
          relatedEventId: null,
        });
      }

      if (caseA.anesthesiologist === caseB.anesthesiologist) {
        conflicts.push({
          id: `CF-${caseA.id}-${caseB.id}-anesthesia`,
          type: "anesthesiologist_overlap",
          severity: "warning",
          message: `${caseA.anesthesiologist} is scheduled on overlapping cases ${caseA.id} and ${caseB.id}.`,
          caseIds: [caseA.id, caseB.id],
          relatedEventId: null,
        });
      }
    }
  }

  return conflicts;
}

export function getScheduleSnapshot(
  requestedDate?: string | null
): ScheduleApiResponse {
  const date = normalizeRequestedDate(requestedDate);

  const surgeryCalendar = db
    .getCasesForDate(date)
    .sort(compareByStartTime)
    .map((surgicalCase) => ({
      ...surgicalCase,
      patient: db.getPatient(surgicalCase.patientId) ?? null,
    }));

  const hospitalCalendar = db
    .getHospitalCalendarForDate(date)
    .sort(compareByStartTime);

  const conflicts = [
    ...buildRoomCalendarConflicts(surgeryCalendar, hospitalCalendar),
    ...buildClinicianOverlapConflicts(surgeryCalendar),
  ];

  return {
    date,
    surgeryCalendar,
    hospitalCalendar,
    conflicts,
    // Backward-compatible alias for existing UI code.
    cases: surgeryCalendar,
  };
}
