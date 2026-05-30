"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight, AlertTriangle, XCircle, CheckCircle,
  Activity, Clock, Zap, Brain, ArrowUpRight,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import ReadinessScore from "@/components/ReadinessScore";
import { BeaconRunResult, AgentTrace } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import demoResults from "@/data/demo-results.json";
import schedule from "@/data/schedule.json";
import patients from "@/data/patients.json";

interface CaseSummary {
  id: string;
  patientName: string;
  mrn: string;
  procedure: string;
  surgeon: string;
  startTime: string;
  score: number;
  status: "ready" | "at-risk" | "blocked";
  missingCount: number;
  actionCount: number;
}

const agentColors: Record<string, string> = {
  "Schedule Monitor":   "bg-blue-100   text-blue-700",
  "Readiness Reviewer": "bg-purple-100 text-purple-700",
  "Care Coordinator":   "bg-orange-100 text-orange-700",
  "Briefing Generator": "bg-teal-100   text-teal-700",
};

export default function ReadinessPage() {
  const [readyCases,   setReadyCases]   = useState<CaseSummary[]>([]);
  const [atRiskCases,  setAtRiskCases]  = useState<CaseSummary[]>([]);
  const [blockedCases, setBlockedCases] = useState<CaseSummary[]>([]);
  const [allTraces,    setAllTraces]    = useState<AgentTrace[]>([]);

  useEffect(() => {
    const demo = demoResults as unknown as BeaconRunResult;
    const patMap = Object.fromEntries(patients.map(p => [p.id, { name: p.name, mrn: p.mrn }]));
    const scMap  = Object.fromEntries(schedule.map(c => [c.id, c]));

    const ready: CaseSummary[] = [], atRisk: CaseSummary[] = [], blocked: CaseSummary[] = [];
    const traces: AgentTrace[] = [];

    Object.entries(demo.results).forEach(([caseId, r]) => {
      const sc = scMap[caseId];
      if (!sc) return;
      const pat = patMap[sc.patientId];
      const s: CaseSummary = {
        id: caseId,
        patientName: pat?.name ?? "Unknown",
        mrn: pat?.mrn ?? "",
        procedure: sc.procedure,
        surgeon: sc.surgeon.replace("Dr. ", ""),
        startTime: sc.startTime,
        score: r.readiness.score,
        status: r.readiness.status,
        missingCount: r.readiness.missingItems.length,
        actionCount: r.actions.length,
      };
      if (r.readiness.status === "ready") ready.push(s);
      else if (r.readiness.status === "at-risk") atRisk.push(s);
      else blocked.push(s);
      traces.push(...r.traces);
    });

    setReadyCases(ready.sort((a,b) => b.score - a.score));
    setAtRiskCases(atRisk.sort((a,b) => a.score - b.score));
    setBlockedCases(blocked.sort((a,b) => a.score - b.score));
    setAllTraces(traces.sort((a,b) => a.timestamp.localeCompare(b.timestamp)).slice(-30));
  }, []);

  const CaseCard = ({ c, column }: { c: CaseSummary; column: "ready" | "at-risk" | "blocked" }) => {
    const borderColor = column === "ready" ? "hover:border-status-ready" :
                        column === "at-risk" ? "hover:border-status-risk" : "hover:border-status-blocked";
    return (
      <Link href={`/case/${c.id}`}>
        <div className={`card card-hover p-4 cursor-pointer group border ${borderColor} animate-fade-up`}>
          <div className="flex items-start justify-between mb-2.5">
            <div className="flex-1 min-w-0 pr-2">
              <div className="font-semibold text-gray-900 text-sm leading-tight">{c.patientName}</div>
              <div className="text-xs text-gray-400 font-mono mt-0.5">{c.mrn}</div>
            </div>
            <ReadinessScore score={c.score} size={42} showLabel={false} />
          </div>

          <div className="text-xs text-gray-600 truncate mb-3">{c.procedure}</div>

          <div className="progress-bar mb-3">
            <div className={`progress-fill ${
              column === "ready" ? "bg-status-ready" :
              column === "at-risk" ? "bg-status-risk" : "bg-status-blocked"
            }`} style={{ width: `${c.score}%`, transition: "width 1s ease-out" }} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <Clock className="w-3 h-3" />
              {formatTime(c.startTime)}
              <span>·</span>
              <span>{c.surgeon}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {c.missingCount > 0 && (
                <span className="text-[10px] text-red-500 font-semibold bg-red-50 px-1.5 py-0.5 rounded-full">
                  {c.missingCount} missing
                </span>
              )}
              {c.actionCount > 0 && (
                <span className="text-[10px] text-orange-500 font-semibold bg-orange-50 px-1.5 py-0.5 rounded-full">
                  {c.actionCount} action{c.actionCount > 1 ? "s" : ""}
                </span>
              )}
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-beacon-600 transition-colors" />
            </div>
          </div>
        </div>
      </Link>
    );
  };

  const columns = [
    { key: "ready" as const, label: "Ready", count: readyCases.length, icon: CheckCircle, color: "text-status-ready", headerBg: "border-t-4 border-status-ready", cases: readyCases },
    { key: "at-risk" as const, label: "At Risk", count: atRiskCases.length, icon: AlertTriangle, color: "text-status-risk", headerBg: "border-t-4 border-status-risk", cases: atRiskCases },
    { key: "blocked" as const, label: "Blocked", count: blockedCases.length, icon: XCircle, color: "text-status-blocked", headerBg: "border-t-4 border-status-blocked", cases: blockedCases },
  ];

  return (
    <div className="min-h-screen bg-surface-50 bg-mesh">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-surface-200 px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-beacon-600" />
            <div>
              <h1 className="font-bold text-gray-900">Readiness Command Center</h1>
              <div className="text-xs text-gray-400">Real-time surgical readiness across all OR cases</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {columns.map(c => (
              <div key={c.key} className={`flex items-center gap-1.5 ${c.color}`}>
                <c.icon className="w-4 h-4" />
                <span className="font-bold text-lg tabular-nums">{c.count}</span>
                <span className="text-sm font-medium">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        <div className="grid grid-cols-4 gap-5">
          {/* Three status columns */}
          <div className="col-span-3 grid grid-cols-3 gap-5">
            {columns.map(col => (
              <div key={col.key}>
                <div className={`card p-3 mb-3 flex items-center gap-2 ${col.headerBg}`}>
                  <col.icon className={`w-4 h-4 ${col.color}`} />
                  <span className="font-semibold text-gray-900">{col.label}</span>
                  <span className={`ml-auto text-lg font-bold ${col.color} tabular-nums`}>{col.count}</span>
                </div>
                <div className="space-y-3">
                  {col.cases.length === 0 ? (
                    <div className="card p-6 text-center text-gray-400 text-sm">No cases</div>
                  ) : (
                    col.cases.map((c, i) => (
                      <div key={c.id} style={{ animationDelay: `${i * 0.06}s` }}>
                        <CaseCard c={c} column={col.key} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Agent activity feed */}
          <div className="card overflow-hidden h-fit sticky top-24">
            <div className="px-4 py-3 border-b border-surface-100 flex items-center gap-2">
              <Brain className="w-4 h-4 text-beacon-600" />
              <div>
                <div className="font-semibold text-gray-900 text-sm">Agent Activity</div>
                <div className="text-xs text-gray-400">Last {allTraces.length} events</div>
              </div>
              <div className="ml-auto">
                <div className="live-dot">
                  <span className="live-dot-ping bg-green-400" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </div>
              </div>
            </div>
            <div className="p-3 space-y-2 max-h-[520px] overflow-y-auto scrollbar-thin">
              {allTraces.map((t, i) => (
                <div
                  key={i}
                  className="flex gap-2 animate-fade-in"
                  style={{ animationDelay: `${i * 0.02}s`, animationFillMode: "both" }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${agentColors[t.agentName] ?? "bg-gray-100 text-gray-600"}`}>
                      {t.agentName.split(" ")[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-gray-700 capitalize leading-snug">
                      {t.action.replace(/_/g, " ")}
                    </div>
                    <div className="text-[11px] text-gray-500 leading-snug line-clamp-2 mt-0.5">{t.output}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      {t.durationMs}ms
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
