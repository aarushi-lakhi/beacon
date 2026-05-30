import { tool } from "@openai/agents";
import { z } from "zod";
import { db } from "@/lib/db";
import { getScheduleSnapshot } from "@/lib/scheduler";

export const getScheduleTool = tool({
  name: "get_or_schedule",
  description: "Load tomorrow's OR schedule and return all upcoming surgical cases",
  parameters: z.object({
    date: z.string().describe("Date in YYYY-MM-DD format, or 'tomorrow'"),
  }),
  execute: async ({ date }) => {
    const snapshot = getScheduleSnapshot(date);
    return JSON.stringify(
      {
        date: snapshot.date,
        surgeryCalendar: snapshot.surgeryCalendar.map((c) => ({
          caseId: c.id,
          patientId: c.patientId,
          procedure: c.procedure,
          surgeon: c.surgeon,
          anesthesiologist: c.anesthesiologist,
          orRoom: c.orRoom,
          startTime: c.startTime,
          estimatedDuration: c.estimatedDuration,
          priority: c.priority,
        })),
        hospitalCalendar: snapshot.hospitalCalendar,
        conflicts: snapshot.conflicts,
      }
    );
  },
});

export const getPatientTool = tool({
  name: "get_patient",
  description: "Retrieve patient demographics and medical history",
  parameters: z.object({ patientId: z.string() }),
  execute: async ({ patientId }) => {
    const patient = db.getPatient(patientId);
    if (!patient) return JSON.stringify({ error: "Patient not found" });
    return JSON.stringify(patient);
  },
});

export const getLabsTool = tool({
  name: "get_labs",
  description: "Retrieve all lab results for a patient, including status and expiration",
  parameters: z.object({ patientId: z.string() }),
  execute: async ({ patientId }) => {
    const labs = db.getLabsForPatient(patientId);
    return JSON.stringify(labs);
  },
});

export const getImagingTool = tool({
  name: "get_imaging",
  description: "Retrieve all imaging studies for a patient, including expiration status",
  parameters: z.object({ patientId: z.string() }),
  execute: async ({ patientId }) => {
    const imaging = db.getImagingForPatient(patientId);
    return JSON.stringify(imaging);
  },
});

export const getClearancesTool = tool({
  name: "get_clearances",
  description: "Retrieve specialist clearance status for a patient",
  parameters: z.object({ patientId: z.string() }),
  execute: async ({ patientId }) => {
    const clearances = db.getClearancesForPatient(patientId);
    return JSON.stringify(clearances);
  },
});

export const getConsentTool = tool({
  name: "get_consent",
  description: "Check consent form status for a patient",
  parameters: z.object({ patientId: z.string() }),
  execute: async ({ patientId }) => {
    const consent = db.getConsentForPatient(patientId);
    return JSON.stringify(consent);
  },
});

export const getCaseTool = tool({
  name: "get_case",
  description: "Get full surgical case details by case ID",
  parameters: z.object({ caseId: z.string() }),
  execute: async ({ caseId }) => {
    const c = db.getCase(caseId);
    if (!c) return JSON.stringify({ error: "Case not found" });
    return JSON.stringify(c);
  },
});
