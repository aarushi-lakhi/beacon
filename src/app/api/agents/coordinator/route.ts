import { NextRequest, NextResponse } from "next/server";
import {
  getDemoReadiness,
  runCareCoordinator,
} from "@/agents/katAgentRunners";
import { db } from "@/lib/db";
import { ReadinessResult } from "@/lib/types";

interface CoordinatorRequest {
  caseId?: string;
  readiness?: ReadinessResult;
}

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  let body: CoordinatorRequest;

  try {
    body = (await req.json()) as CoordinatorRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const caseId = body.caseId;
  if (!caseId) {
    return NextResponse.json(
      { error: "caseId is required" },
      { status: 400 }
    );
  }

  const surgicalCase = db.getCase(caseId);
  if (!surgicalCase) {
    return NextResponse.json(
      { error: "Case not found" },
      { status: 404 }
    );
  }

  const readiness = body.readiness ?? getDemoReadiness(caseId);
  if (!readiness) {
    return NextResponse.json(
      {
        error:
          "Readiness result is required for this case. Provide readiness in the request body.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await runCareCoordinator(caseId, readiness, {
      useDemoFixture: !body.readiness,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Care Coordinator failed:", err);
    return NextResponse.json(
      { error: "Care Coordinator failed", detail: String(err) },
      { status: 500 }
    );
  }
}
