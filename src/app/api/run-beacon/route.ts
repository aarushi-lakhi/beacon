import { NextResponse } from "next/server";
import { runBeaconAnalysis } from "@/agents/orchestrator";

export const maxDuration = 300;

export async function POST() {
  try {
    const result = await runBeaconAnalysis();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Beacon run failed:", err);
    return NextResponse.json(
      { error: "Agent run failed", detail: String(err) },
      { status: 500 }
    );
  }
}
