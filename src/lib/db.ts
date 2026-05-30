import patientsData from "@/data/patients.json";
import scheduleData from "@/data/schedule.json";
import labsData from "@/data/labs.json";
import imagingData from "@/data/imaging.json";
import clearancesData from "@/data/clearances.json";
import consentData from "@/data/consent.json";

import {
  Patient,
  SurgicalCase,
  LabResult,
  ImagingResult,
  Clearance,
  ConsentForm,
} from "./types";

export const db = {
  patients: patientsData as Patient[],
  schedule: scheduleData as SurgicalCase[],
  labs: labsData as LabResult[],
  imaging: imagingData as ImagingResult[],
  clearances: clearancesData as Clearance[],
  consent: consentData as ConsentForm[],

  getPatient: (id: string): Patient | undefined =>
    patientsData.find((p) => p.id === id) as Patient | undefined,

  getCase: (id: string): SurgicalCase | undefined =>
    scheduleData.find((c) => c.id === id) as SurgicalCase | undefined,

  getCasesForDate: (date: string): SurgicalCase[] =>
    (scheduleData as SurgicalCase[]).filter((c) => c.date === date),

  getLabsForPatient: (patientId: string): LabResult[] =>
    (labsData as LabResult[]).filter((l) => l.patientId === patientId),

  getImagingForPatient: (patientId: string): ImagingResult[] =>
    (imagingData as ImagingResult[]).filter((i) => i.patientId === patientId),

  getClearancesForPatient: (patientId: string): Clearance[] =>
    (clearancesData as Clearance[]).filter((c) => c.patientId === patientId),

  getConsentForPatient: (patientId: string): ConsentForm[] =>
    (consentData as ConsentForm[]).filter((c) => c.patientId === patientId),

  getTomorrowSchedule: (): SurgicalCase[] => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    const cases = (scheduleData as SurgicalCase[]).filter(
      (c) => c.date === dateStr
    );
    // Always return demo schedule even if date doesn't match
    return cases.length > 0
      ? cases
      : (scheduleData as SurgicalCase[]).slice(0, 15);
  },
};
