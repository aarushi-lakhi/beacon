import patientsData from "@/data/patients.json";
import scheduleData from "@/data/schedule.json";
import labsData from "@/data/labs.json";
import imagingData from "@/data/imaging.json";
import clearancesData from "@/data/clearances.json";
import consentData from "@/data/consent.json";
import hospitalCalendarData from "@/data/hospital-calendar.json";

import {
  Patient,
  SurgicalCase,
  LabResult,
  ImagingResult,
  Clearance,
  ConsentForm,
  HospitalCalendarEvent,
} from "./types";
import { getTomorrowDate } from "./utils";

function resolveDateToken(dateValue: string): string {
  return dateValue === "TOMORROW" ? getTomorrowDate() : dateValue;
}

function normalizeCase(surgicalCase: SurgicalCase): SurgicalCase {
  return { ...surgicalCase, date: resolveDateToken(surgicalCase.date) };
}

function normalizeHospitalEvent(event: HospitalCalendarEvent): HospitalCalendarEvent {
  return { ...event, date: resolveDateToken(event.date) };
}

const normalizedSchedule = (scheduleData as SurgicalCase[]).map(normalizeCase);
const normalizedHospitalCalendar = (hospitalCalendarData as HospitalCalendarEvent[]).map(
  normalizeHospitalEvent
);

export const db = {
  patients: patientsData as Patient[],
  schedule: normalizedSchedule,
  labs: labsData as LabResult[],
  imaging: imagingData as ImagingResult[],
  clearances: clearancesData as Clearance[],
  consent: consentData as ConsentForm[],
  hospitalCalendar: normalizedHospitalCalendar,

  getPatient: (id: string): Patient | undefined =>
    (patientsData as Patient[]).find((p) => p.id === id),

  getCase: (id: string): SurgicalCase | undefined =>
    normalizedSchedule.find((c) => c.id === id),

  getCasesForDate: (date: string): SurgicalCase[] => {
    const resolvedDate = resolveDateToken(date);
    return normalizedSchedule.filter((c) => c.date === resolvedDate);
  },

  getLabsForPatient: (patientId: string): LabResult[] =>
    (labsData as LabResult[]).filter((l) => l.patientId === patientId),

  getImagingForPatient: (patientId: string): ImagingResult[] =>
    (imagingData as ImagingResult[]).filter((i) => i.patientId === patientId),

  getClearancesForPatient: (patientId: string): Clearance[] =>
    (clearancesData as Clearance[]).filter((c) => c.patientId === patientId),

  getConsentForPatient: (patientId: string): ConsentForm[] =>
    (consentData as ConsentForm[]).filter((c) => c.patientId === patientId),

  getHospitalCalendarForDate: (date: string): HospitalCalendarEvent[] => {
    const resolvedDate = resolveDateToken(date);
    return normalizedHospitalCalendar.filter((event) => event.date === resolvedDate);
  },

  getTomorrowHospitalCalendar: (): HospitalCalendarEvent[] =>
    normalizedHospitalCalendar.filter((event) => event.date === getTomorrowDate()),

  getTomorrowSchedule: (): SurgicalCase[] =>
    normalizedSchedule.filter((c) => c.date === getTomorrowDate()),
};
