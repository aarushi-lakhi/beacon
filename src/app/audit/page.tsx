"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ScrollText, Filter, CheckCircle, AlertTriangle,
  XCircle, Info, Brain, ChevronRight, Search,
} from "lucide-react";
import auditLog from "@/data/audit-log.json";

type Severity = "all" | "critical" | "warning" | "info";
type Category = "all" | "system" | "agent" | "readiness" | "action" | "briefing";

interface AuditEntry {
  id: string;
  ts: string;
  agent: string;
  caseId: string | null;
  severity: string;
  category: string;
  message: string;
  actor: string;
}

const severityConfig = {
  critical: { icon: XCircle,       color: "text-red-500",    bg: "bg-red-50",    border: "border-red-200",    label: "Critical" },
  warning:  { icon: AlertTriangle, color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-200",  label: "Warning" },
  info:     { icon: Info,          color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-200",   label: "Info" },
};

const agentColors: Record<string, string> = {
  "Schedule Monitor":   "bg-blue-100   text-blue-800",
  "Readiness Reviewer": "bg-purple-100 text-purple-800",
  "Care Coordinator":   "bg-orange-100 text-orange-800",
  "Briefing Generator": "bg-teal-100   text-teal-800",
  "System":             "bg-gray-100   text-gray-700",
};

export default function AuditPage() {
  const [severityFilter, setSeverityFilter] = useState<Severity>("all");
  const [categoryFilter, setCategoryFilter] = useState<Category>("all");
  const [search, setSearch] = useState("");

  const entries = auditLog as AuditEntry[];

  const filtered = useMemo(() => entries.filter(e => {
    if (severityFilter !== "all" && e.severity !== severityFilter) return false;
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    if (search && !e.message.toLowerCase().includes(search.toLowerCase()) &&
        !e.agent.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [entries, severityFilter, categoryFilter, search]);

  const counts = useMemo(() => ({
    critical: entries.filter(e => e.severity === "critical").length,
    warning:  entries.filter(e => e.severity === "warning").length,
    info:     entries.filter(e => e.severity === "info").length,
  }), [entries]);

  return (
    <div className="min-h-screen bg-surface-50 bg-mesh">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-surface-200 px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScrollText className="w-5 h-5 text-beacon-600" />
            <div>
              <h1 className="font-bold text-gray-900">Audit Log</h1>
              <div className="text-xs text-gray-400">Complete agent activity trace · HIPAA-compliant</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{entries.length} events</span>
            <div className="h-4 w-px bg-surface-200" />
            <span>Run: 2026-05-31 05:45 UTC</span>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-4">
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4">
          {(["critical","warning","info"] as const).map(sev => {
            const cfg = severityConfig[sev];
            const Icon = cfg.icon;
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(s => s === sev ? "all" : sev)}
                className={`card p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-card-hover ${
                  severityFilter === sev ? `ring-2 ring-offset-1 ${sev === "critical" ? "ring-red-400" : sev === "warning" ? "ring-amber-400" : "ring-blue-400"}` : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${cfg.color} tabular-nums`}>{counts[sev]}</div>
                  <div className="text-sm text-gray-500">{cfg.label} events</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="card p-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <Filter className="w-4 h-4" />
            Filters:
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search messages or agents…"
              className="flex-1 text-sm border-0 outline-none bg-transparent placeholder-gray-400"
            />
          </div>

          <div className="h-5 w-px bg-surface-200" />

          {/* Severity */}
          <div className="flex items-center gap-1">
            {(["all","critical","warning","info"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  severityFilter === s ? "bg-beacon-600 text-white" : "bg-surface-100 text-gray-600 hover:bg-surface-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-surface-200" />

          {/* Category */}
          <div className="flex items-center gap-1">
            {(["all","system","agent","readiness","action","briefing"] as const).map(c => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  categoryFilter === c ? "bg-beacon-600 text-white" : "bg-surface-100 text-gray-600 hover:bg-surface-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-100 flex items-center justify-between">
            <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-beacon-600" />
              Event Timeline
            </div>
            <div className="text-xs text-gray-400">{filtered.length} of {entries.length} events</div>
          </div>

          <div className="divide-y divide-surface-100 max-h-[600px] overflow-y-auto scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No events match your filters</div>
            ) : (
              filtered.map((entry, i) => {
                const sev = severityConfig[entry.severity as keyof typeof severityConfig] ?? severityConfig.info;
                const Icon = sev.icon;
                const time = new Date(entry.ts).toLocaleTimeString("en-US", {
                  hour: "2-digit", minute: "2-digit", second: "2-digit"
                });

                return (
                  <div
                    key={entry.id}
                    className={`flex gap-4 px-4 py-3 hover:bg-surface-50 transition-colors animate-fade-in`}
                    style={{ animationDelay: `${i * 0.015}s`, animationFillMode: "both" }}
                  >
                    {/* Timestamp */}
                    <div className="flex-shrink-0 w-20 text-right">
                      <div className="text-xs font-mono text-gray-400 tabular-nums">{time}</div>
                    </div>

                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-5 h-5 rounded-full ${sev.bg} flex items-center justify-center`}>
                        <Icon className={`w-3 h-3 ${sev.color}`} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${agentColors[entry.agent] ?? "bg-gray-100 text-gray-700"}`}>
                          {entry.agent}
                        </span>
                        <span className={`text-xs font-medium capitalize ${sev.color}`}>
                          {entry.severity}
                        </span>
                        <span className="text-xs text-gray-400 capitalize">{entry.category}</span>
                        {entry.caseId && (
                          <Link href={`/case/${entry.caseId}`}>
                            <span className="text-xs text-beacon-600 font-medium hover:text-beacon-700 flex items-center gap-0.5">
                              {entry.caseId}
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </Link>
                        )}
                      </div>
                      <div className={`text-sm text-gray-700 leading-relaxed ${
                        entry.severity === "critical" ? "font-medium" : ""
                      }`}>
                        {entry.message}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
