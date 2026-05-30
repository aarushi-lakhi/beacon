import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTomorrowDate } from "@/lib/utils";

export async function GET() {
  const cases = db.getTomorrowSchedule();
  const date = getTomorrowDate();

  const enriched = cases.map((c) => {
    const patient = db.getPatient(c.patientId);
    return { ...c, date, patient };
  });

  return NextResponse.json({ date, cases: enriched });
}
