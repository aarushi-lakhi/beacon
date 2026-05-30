import patientsData from "@/data/patients.json";
import scheduleData from "@/data/schedule.json";
import labsData from "@/data/labs.json";
import imagingData from "@/data/imaging.json";
import glisRtImagingData from "@/data/glis-rt-imaging.json";
import glisRtPatientMapData from "@/data/glis-rt-patient-map.json";
import clearancesData from "@/data/clearances.json";
import consentData from "@/data/consent.json";
import hospitalCalendarData from "@/data/hospital-calendar.json";

import {
  Patient,
  SurgicalCase,
  LabResult,
  ImagingResult,
  ImagingSourceMap,
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
const defaultImagingRecords = imagingData as ImagingResult[];
const glisRtImagingRecords = glisRtImagingData as ImagingResult[];
const glisRtPatientMap = glisRtPatientMapData as ImagingSourceMap[];

export const db = {
  patients: patientsData as Patient[],
  schedule: normalizedSchedule,
  labs: labsData as LabResult[],
  imaging: defaultImagingRecords,
  externalImaging: glisRtImagingRecords,
  clearances: clearancesData as Clearance[],
  consent: consentData as ConsentForm[],
  hospitalCalendar: normalizedHospitalCalendar,
  imagingSourceMap: glisRtPatientMap,

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

  getImagingForPatient: (patientId: string): ImagingResult[] => {
    const baseline = defaultImagingRecords.filter((item) => item.patientId === patientId);
    const external = glisRtImagingRecords.filter((item) => item.patientId === patientId);

    return [...baseline, ...external].sort((left, right) => {
      const leftDate = left.date ?? "";
      const rightDate = right.date ?? "";
      if (leftDate === rightDate) return left.id.localeCompare(right.id);
      return rightDate.localeCompare(leftDate);
    });
  },

  getImagingSourceForPatient: (patientId: string): ImagingSourceMap | undefined =>
    glisRtPatientMap.find((item) => item.beaconPatientId === patientId),

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
