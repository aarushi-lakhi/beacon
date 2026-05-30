import { NextResponse } from "next/server";
import { getScheduleSnapshot } from "@/lib/scheduler";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const schedule = getScheduleSnapshot(date);
  return NextResponse.json(schedule);
}
