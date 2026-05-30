import { NextResponse } from "next/server";
import demoResults from "@/data/demo-results.json";
import { BeaconRunResult, ExecutiveMetrics } from "@/lib/types";

export async function GET() {
  const demo = demoResults as BeaconRunResult;

  const issuesResolved = Object.values(demo.results).reduce((sum, r) => {
    return sum + r.actions.filter((a) => a.status === "resolved").length;
  }, 0);

  const orTimeSaved =
    demo.blockedCases * 45 + demo.atRiskCases * 15;

  const metrics: ExecutiveMetrics = {
    totalCasesTomorrow: demo.casesProcessed,
    casesReviewed: demo.casesProcessed,
    readyCases: demo.readyCases,
    atRiskCases: demo.atRiskCases,
    blockedCases: demo.blockedCases,
    cancellationRiskPercent: Math.round(
      ((demo.atRiskCases * 0.3 + demo.blockedCases) / demo.casesProcessed) * 100
    ),
    issuesResolved,
    estimatedORTimeSavedMinutes: orTimeSaved,
    actionsSent: demo.totalActions,
    lastRunAt: demo.completedAt,
  };

  return NextResponse.json(metrics);
}
