"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, AlertTriangle, XCircle, CheckCircle, Zap } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import ReadinessScore from "@/components/ReadinessScore";
import AgentActivityFeed from "@/components/AgentActivityFeed";
import { BeaconRunResult, AgentTrace } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import demoResults from "@/data/demo-results.json";
import schedule from "@/data/schedule.json";
import patients from "@/data/patients.json";

interface CaseSummary {
  id: string;
  patientName: string;
  procedure: string;
  surgeon: string;
  startTime: string;
  score: number;
  status: "ready" | "at-risk" | "blocked";
  missingCount: number;
}

export default function ReadinessPage() {
  const [readyCases, setReadyCases] = useState<CaseSummary[]>([]);
  const [atRiskCases, setAtRiskCases] = useState<CaseSummary[]>([]);
  const [blockedCases, setBlockedCases] = useState<CaseSummary[]>([]);
  const [allTraces, setAllTraces] = useState<AgentTrace[]>([]);

  useEffect(() => {
    const demo = demoResults as unknown as BeaconRunResult;
    const patientMap = Object.fromEntries(
      patients.map((p) => [p.id, p.name])
    );
    const caseMap = Object.fromEntries(
      schedule.map((c) => [c.id, c])
    );

    const ready: CaseSummary[] = [];
    const atRisk: CaseSummary[] = [];
    const blocked: CaseSummary[] = [];
    const traces: AgentTrace[] = [];

    Object.entries(demo.results).forEach(([caseId, r]) => {
      const sc = caseMap[caseId];
      if (!sc) return;
      const summary: CaseSummary = {
        id: caseId,
        patientName: patientMap[sc.patientId] ?? "Unknown",
        procedure: sc.procedure,
        surgeon: sc.surgeon,
        startTime: sc.startTime,
        score: r.readiness.score,
        status: r.readiness.status,
        missingCount: r.readiness.missingItems.length,
      };
      if (r.readiness.status === "ready") ready.push(summary);
      else if (r.readiness.status === "at-risk") atRisk.push(summary);
      else blocked.push(summary);
      traces.push(...r.traces);
    });

    setReadyCases(ready.sort((a, b) => b.score - a.score));
    setAtRiskCases(atRisk.sort((a, b) => a.score - b.score));
    setBlockedCases(blocked.sort((a, b) => a.score - b.score));
    setAllTraces(traces.sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
  }, []);

  const CaseCard = ({ c }: { c: CaseSummary }) => (
    <Link href={`/case/${c.id}`}>
      <div className="card p-4 hover:shadow-md transition-shadow cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">{c.patientName}</div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">{c.procedure}</div>
          </div>
          <ReadinessScore score={c.score} size={44} showLabel={false} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <StatusBadge status={c.status} size="sm" />
            <div className="text-xs text-gray-400 mt-1">{formatTime(c.startTime)} · {c.surgeon.replace("Dr. ", "")}</div>
          </div>
          {c.missingCount > 0 && (
            <span className="text-xs text-red-500 font-medium">
              {c.missingCount} missing
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-beacon-blue transition-colors" />
        </div>
      </div>
    </Link>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-beacon-blue" />
          <h1 className="text-2xl font-bold text-gray-900">Readiness Command Center</h1>
        </div>
        <p className="text-gray-500">Real-time surgical readiness overview across all OR cases</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-3 flex items-center gap-3 border-l-4 border-green-500">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <div>
            <div className="text-xl font-bold text-green-600">{readyCases.length}</div>
            <div className="text-xs text-gray-500">Ready to proceed</div>
          </div>
        </div>
        <div className="card p-3 flex items-center gap-3 border-l-4 border-amber-500">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <div>
            <div className="text-xl font-bold text-amber-600">{atRiskCases.length}</div>
            <div className="text-xs text-gray-500">Require attention</div>
          </div>
        </div>
        <div className="card p-3 flex items-center gap-3 border-l-4 border-red-500">
          <XCircle className="w-5 h-5 text-red-500" />
          <div>
            <div className="text-xl font-bold text-red-600">{blockedCases.length}</div>
            <div className="text-xs text-gray-500">Cannot proceed</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-3 grid grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <h2 className="font-semibold text-gray-900">Ready ({readyCases.length})</h2>
            </div>
            <div className="space-y-3">
              {readyCases.map((c) => <CaseCard key={c.id} c={c} />)}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-gray-900">At Risk ({atRiskCases.length})</h2>
            </div>
            <div className="space-y-3">
              {atRiskCases.map((c) => <CaseCard key={c.id} c={c} />)}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="w-4 h-4 text-red-500" />
              <h2 className="font-semibold text-gray-900">Blocked ({blockedCases.length})</h2>
            </div>
            <div className="space-y-3">
              {blockedCases.map((c) => <CaseCard key={c.id} c={c} />)}
            </div>
          </div>
        </div>

        <div>
          <AgentActivityFeed traces={allTraces} title="Agent Activity Log" />
        </div>
      </div>
    </div>
  );
}
