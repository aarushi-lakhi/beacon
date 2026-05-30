import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import demoResults from "@/data/demo-results.json";
import { BeaconRunResult, CaseDetail } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const surgicalCase = db.getCase(id);
  if (!surgicalCase) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const patient = db.getPatient(surgicalCase.patientId);
  const labs = db.getLabsForPatient(surgicalCase.patientId);
  const imaging = db.getImagingForPatient(surgicalCase.patientId);
  const clearances = db.getClearancesForPatient(surgicalCase.patientId);
  const consent = db.getConsentForPatient(surgicalCase.patientId);

  const demo = demoResults as BeaconRunResult;
  const demoCase = demo.results[id];

  const detail: CaseDetail = {
    case: surgicalCase,
    patient: patient!,
    labs,
    imaging,
    clearances,
    consent,
    readiness: demoCase?.readiness ?? null,
    actions: demoCase?.actions ?? [],
    briefing: demoCase?.briefing ?? null,
    traces: demoCase?.traces ?? [],
  };

  return NextResponse.json(detail);
}
