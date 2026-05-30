"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  GitBranch, CheckCircle, Clock, Zap, Brain,
  ArrowRight, ChevronRight, Timer,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import demoResults from "@/data/demo-results.json";
import schedule from "@/data/schedule.json";
import patients from "@/data/patients.json";
import { BeaconRunResult, AgentTrace } from "@/lib/types";
import { formatTime } from "@/lib/utils";

const PIPELINE = [
  {
    id: "schedule",
    name: "Schedule Monitor",
    role: "Loads tomorrow's OR schedule. Identifies all cases requiring readiness review. Flags urgent and emergent cases for priority processing.",
    color: "blue",
    bgLight: "bg-blue-50",
    border: "border-blue-200",
    iconBg: "bg-blue-500",
    textColor: "text-blue-700",
    action: "Loaded 15 cases",
  },
  {
    id: "readiness",
    name: "Readiness Reviewer",
    role: "Checks labs, imaging, consent forms, and specialist clearances for each case. Scores readiness 0–100. Classifies as Ready, At Risk, or Blocked.",
    color: "purple",
    bgLight: "bg-purple-50",
    border: "border-purple-200",
    iconBg: "bg-purple-500",
    textColor: "text-purple-700",
    action: "15 cases assessed",
  },
  {
    id: "coordinator",
    name: "Care Coordinator",
    role: "Creates targeted actions for every gap found: escalations to specialists, surgeon notifications, pre-op nursing alerts, and OR scheduling holds.",
    color: "orange",
    bgLight: "bg-orange-50",
    border: "border-orange-200",
    iconBg: "bg-orange-500",
    textColor: "text-orange-700",
    action: "14 actions dispatched",
  },
  {
    id: "briefing",
    name: "Briefing Generator",
    role: "Produces concise clinical pre-operative briefings for each case including key risks, anesthesia considerations, and outstanding items.",
    color: "teal",
    bgLight: "bg-teal-50",
    border: "border-teal-200",
    iconBg: "bg-teal-500",
    textColor: "text-teal-700",
    action: "15 briefings generated",
  },
];

const agentNameMap: Record<string, string> = {
  "Schedule Monitor":   "schedule",
  "Readiness Reviewer": "readiness",
  "Care Coordinator":   "coordinator",
  "Briefing Generator": "briefing",
};

interface CaseRow {
  id: string;
  name: string;
  procedure: string;
  startTime: string;
  score: number;
  status: "ready" | "at-risk" | "blocked";
  traces: AgentTrace[];
  actions: number;
  totalDurationMs: number;
}

export default function OrchestrationPage() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [animStep, setAnimStep] = useState(0);

  useEffect(() => {
    const demo = demoResults as unknown as BeaconRunResult;
    const patMap = Object.fromEntries(patients.map(p => [p.id, p.name]));
    const scMap = Object.fromEntries(schedule.map(c => [c.id, c]));

    const rows: CaseRow[] = Object.entries(demo.results).map(([caseId, r]) => {
      const sc = scMap[caseId];
      const totalMs = r.traces.reduce((s, t) => s + t.durationMs, 0);
      return {
        id: caseId,
        name: patMap[sc?.patientId ?? ""] ?? "Unknown",
        procedure: sc?.procedure ?? "",
        startTime: sc?.startTime ?? "",
        score: r.readiness.score,
        status: r.readiness.status,
        traces: r.traces,
        actions: r.actions.length,
        totalDurationMs: totalMs,
      };
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));

    setCases(rows);
    setSelectedCase(rows[0]?.id ?? null);

    // Animate pipeline steps
    let step = 0;
    const id = setInterval(() => {
      step++;
      setAnimStep(step);
      if (step >= PIPELINE.length) clearInterval(id);
    }, 400);
    return () => clearInterval(id);
  }, []);

  const demo = demoResults as unknown as BeaconRunResult;
  const totalDuration = 47312;

  const selectedTraces = cases.find(c => c.id === selectedCase)?.traces ?? [];

  return (
    <div className="min-h-screen bg-surface-50 bg-mesh">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-surface-200 px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-beacon-600" />
            <div>
              <h1 className="font-bold text-gray-900">Agent Orchestration</h1>
              <div className="text-xs text-gray-400">Live pipeline view · OpenAI Agents SDK</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-green-600 font-medium">
              <CheckCircle className="w-4 h-4" />
              Run complete in {(totalDuration / 1000).toFixed(1)}s
            </div>
            <div className="h-4 w-px bg-surface-200" />
            <span className="text-gray-500">{demo.casesProcessed} cases · {demo.totalActions} actions</span>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Pipeline visualization */}
        <div className="card p-6">
          <div className="section-header mb-4">Agent Pipeline — Sequential Execution</div>
          <div className="flex items-stretch gap-0">
            {PIPELINE.map((agent, i) => (
              <div key={agent.id} className="flex items-stretch flex-1">
                <div
                  className={`flex-1 rounded-xl border-2 p-4 transition-all duration-500 ${
                    i < animStep
                      ? `${agent.border} ${agent.bgLight}`
                      : "border-surface-200 bg-white opacity-40"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg ${i < animStep ? agent.iconBg : "bg-gray-200"} flex items-center justify-center flex-shrink-0 transition-colors duration-300`}>
                      {i < animStep
                        ? <CheckCircle className="w-4 h-4 text-white" />
                        : <Brain className="w-4 h-4 text-gray-400" />
                      }
                    </div>
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-wider ${i < animStep ? agent.textColor : "text-gray-400"}`}>
                        Agent {i + 1}
                      </div>
                      <div className="font-semibold text-gray-900 text-sm leading-tight mt-0.5">{agent.name}</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{agent.role}</p>
                  {i < animStep && (
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${agent.textColor} animate-fade-in`}>
                      <CheckCircle className="w-3 h-3" />
                      {agent.action}
                    </div>
                  )}
                </div>
                {i < PIPELINE.length - 1 && (
                  <div className="flex items-center px-2">
                    <ArrowRight className={`w-5 h-5 transition-colors duration-500 ${i + 1 <= animStep ? "text-beacon-500" : "text-gray-200"}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Case breakdown */}
        <div className="grid grid-cols-5 gap-5">
          {/* Case list */}
          <div className="col-span-2 card overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-100">
              <div className="font-semibold text-gray-900 text-sm">Case Processing Results</div>
              <div className="text-xs text-gray-400 mt-0.5">Click to inspect per-agent traces</div>
            </div>
            <div className="divide-y divide-surface-100 overflow-y-auto max-h-[480px] scrollbar-thin">
              {cases.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCase(c.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-surface-50 transition-colors ${selectedCase === c.id ? "bg-beacon-50 border-l-2 border-beacon-500" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                  <div className="text-xs text-gray-400 truncate mb-2">{c.procedure}</div>
                  {/* Score bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          c.status === "ready" ? "bg-status-ready" :
                          c.status === "at-risk" ? "bg-status-risk" : "bg-status-blocked"
                        }`}
                        style={{ width: `${c.score}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${
                      c.status === "ready" ? "text-status-ready" :
                      c.status === "at-risk" ? "text-status-risk" : "text-status-blocked"
                    }`}>{c.score}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <Timer className="w-3 h-3" />{c.totalDurationMs}ms
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />{c.actions} action{c.actions !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{formatTime(c.startTime)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Trace detail */}
          <div className="col-span-3 card overflow-hidden">
            <div className="px-4 py-3 border-b border-surface-100 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 text-sm">
                  Agent Traces — {cases.find(c => c.id === selectedCase)?.name ?? "Select a case"}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">Step-by-step agent reasoning and tool calls</div>
              </div>
              {selectedCase && (
                <Link href={`/case/${selectedCase}`} className="flex items-center gap-1 text-xs text-beacon-600 font-medium hover:text-beacon-700">
                  Full case detail
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
            <div className="p-4 space-y-2 overflow-y-auto max-h-[480px] scrollbar-thin">
              {selectedTraces.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Select a case to view agent traces</div>
              ) : (
                selectedTraces.map((trace, i) => {
                  const agentId = agentNameMap[trace.agentName] ?? "schedule";
                  const agent = PIPELINE.find(p => p.id === agentId)!;
                  return (
                    <div
                      key={i}
                      className={`rounded-lg border p-3 ${agent?.bgLight ?? "bg-gray-50"} ${agent?.border ?? "border-gray-200"} animate-fade-in`}
                      style={{ animationDelay: `${i * 0.04}s`, animationFillMode: "both" }}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${agent?.textColor ?? "text-gray-700"} uppercase tracking-wider`}>
                            {trace.agentName}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {trace.action.replace(/_/g, " ")}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono tabular-nums flex-shrink-0">
                          {trace.durationMs}ms
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">
                        <span className="font-medium text-gray-600">Input:</span> {trace.input}
                      </div>
                      <div className="text-xs text-gray-700 leading-relaxed bg-white/60 rounded px-2 py-1.5 font-mono">
                        {trace.output}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Timing summary */}
        <div className="card p-5">
          <div className="section-header">Pipeline Performance Summary</div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Run Time", val: "47.3s", sub: "15 cases end-to-end", icon: Timer, color: "text-beacon-600" },
              { label: "Avg Per Case", val: "3.2s", sub: "All 4 agents sequential", icon: Zap, color: "text-purple-600" },
              { label: "Actions Created", val: demo.totalActions.toString(), sub: "Dispatched automatically", icon: CheckCircle, color: "text-green-600" },
              { label: "Issues Caught", val: (demo.atRiskCases + demo.blockedCases).toString(), sub: `${demo.blockedCases} blocked · ${demo.atRiskCases} at risk`, icon: Brain, color: "text-orange-600" },
            ].map(({ label, val, sub, icon: Icon, color }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-surface-50 border border-surface-200">
                <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
                <div className={`text-2xl font-bold ${color} tabular-nums`}>{val}</div>
                <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
