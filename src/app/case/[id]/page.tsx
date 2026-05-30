"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import {
  ArrowLeft, AlertTriangle, XCircle, CheckCircle,
  FlaskConical, ScanLine, FileText, UserCheck,
  MessageSquare, Brain, Clock, User, Zap,
  ChevronRight, Activity,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import ReadinessScore from "@/components/ReadinessScore";
import { CaseDetail, MissingItem, CoordinationAction } from "@/lib/types";
import { formatTime, formatDuration, severityToColor } from "@/lib/utils";

const typeIcons = {
  lab: FlaskConical, imaging: ScanLine, consent: FileText, clearance: UserCheck,
};

const actionTypeLabels: Record<CoordinationAction["type"], string> = {
  escalate: "Escalated",
  notify_surgeon: "Surgeon Notified",
  notify_nurse: "Nursing Notified",
  notify_anesthesia: "Anesthesia Notified",
  create_ticket: "Ticket Created",
  send_reminder: "Reminder Sent",
};

const agentColors: Record<string, string> = {
  "Schedule Monitor":   "bg-blue-100   text-blue-700",
  "Readiness Reviewer": "bg-purple-100 text-purple-700",
  "Care Coordinator":   "bg-orange-100 text-orange-700",
  "Briefing Generator": "bg-teal-100   text-teal-700",
};

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [tab, setTab] = useState<"overview" | "briefing" | "agents">("overview");

  useEffect(() => {
    fetch(`/api/cases/${id}`).then(r => r.json()).then(setDetail);
  }, [id]);

  if (!detail) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400 text-sm animate-pulse">Loading case…</div>
      </div>
    );
  }

  const { case: c, patient, readiness, actions, briefing, traces } = detail;

  const statusGradient = readiness?.status === "ready"
    ? "from-green-50 to-emerald-50/30"
    : readiness?.status === "at-risk"
    ? "from-amber-50 to-yellow-50/30"
    : "from-red-50 to-rose-50/30";

  const MissingRow = ({ item }: { item: MissingItem }) => {
    const Icon = typeIcons[item.type];
    return (
      <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${
        item.severity === "critical"
          ? "border-red-200 bg-gradient-to-r from-red-50 to-rose-50"
          : "border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50"
      } animate-fade-in`}>
        <div className={`flex-shrink-0 mt-0.5 ${severityToColor(item.severity)}`}>
          {item.severity === "critical"
            ? <XCircle className="w-4.5 h-4.5" style={{width:18,height:18}} />
            : <AlertTriangle className="w-4.5 h-4.5" style={{width:18,height:18}} />
          }
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <Icon className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm font-semibold text-gray-900">{item.name}</span>
            <span className={`text-xs font-bold uppercase tracking-wider ${severityToColor(item.severity)}`}>
              {item.severity}
            </span>
          </div>
          <div className="text-xs text-gray-600 leading-relaxed">{item.description}</div>
        </div>
      </div>
    );
  };

  const ActionCard = ({ action }: { action: CoordinationAction }) => {
    const borderColors = { critical: "border-red-300 bg-gradient-to-r from-red-50 to-rose-50", high: "border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50", medium: "border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50" };
    const textColors = { critical: "text-red-600", high: "text-amber-600", medium: "text-blue-600" };
    return (
      <div className={`rounded-xl border p-4 ${borderColors[action.priority]} animate-fade-in`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600">{actionTypeLabels[action.type]}</span>
            <span className={`text-xs font-bold uppercase ${textColors[action.priority]} px-2 py-0.5 rounded-full ${
              action.priority === "critical" ? "bg-red-100" : action.priority === "high" ? "bg-amber-100" : "bg-blue-100"
            }`}>{action.priority}</span>
          </div>
          <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />Sent
          </span>
        </div>
        <div className="text-xs font-semibold text-gray-800 mb-1.5 flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          {action.target}
        </div>
        <div className="text-xs text-gray-600 leading-relaxed bg-white/60 rounded-lg px-3 py-2">{action.message}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface-50 bg-mesh">
      {/* Sticky case header */}
      <div className={`sticky top-0 z-30 bg-gradient-to-r ${statusGradient} backdrop-blur border-b border-surface-200 px-8 py-3`}>
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
            Schedule
          </Link>
          <div className="h-4 w-px bg-surface-300" />
          <div className="flex-1 flex items-center gap-4 min-w-0">
            <div className="min-w-0">
              <div className="font-bold text-gray-900 truncate">{patient?.name}</div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <span className="font-mono">{patient?.mrn}</span>
                <span>·</span>
                <Clock className="w-3 h-3" />
                <span>{formatTime(c.startTime)}</span>
                <span>·</span>
                <span>{c.orRoom}</span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3 flex-shrink-0">
              {readiness && <ReadinessScore score={readiness.score} size={52} showLabel={false} />}
              {readiness && <StatusBadge status={readiness.status} />}
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        {/* Patient header card */}
        <div className="card p-6 mb-5 animate-fade-up">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-beacon-600 to-blue-700 flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">{patient?.name}</h2>
                {patient?.allergies?.length > 0 && (
                  <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                    ⚠ Allergies: {patient.allergies.join(", ")}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Age {patient?.age} · {patient?.gender === "M" ? "Male" : "Female"} · BMI {patient?.bmi} · Blood Type {patient?.bloodType}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {patient?.comorbidities?.map(c => (
                  <span key={c} className="text-xs bg-surface-100 text-gray-600 border border-surface-200 px-2.5 py-0.5 rounded-full font-medium">{c}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4 mt-5 pt-5 border-t border-surface-100">
            {[
              { label: "Procedure", val: c.procedure },
              { label: "Surgeon", val: c.surgeon },
              { label: "Anesthesiologist", val: c.anesthesiologist },
              { label: "Anesthesia", val: c.anesthesiaType },
              { label: "Est. Duration", val: formatDuration(c.estimatedDuration) },
            ].map(({ label, val }) => (
              <div key={label}>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
                <div className="text-sm font-medium text-gray-900 leading-snug">{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-5 bg-surface-100 p-1 rounded-xl w-fit border border-surface-200">
          {(["overview", "briefing", "agents"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${
                tab === t ? "bg-white text-gray-900 shadow-card" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "overview" ? "Readiness Overview" : t === "briefing" ? "Surgical Briefing" : "Agent Traces"}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 space-y-4">
              {readiness && (
                <div className="card p-5 animate-fade-in">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-beacon-600" />
                    Readiness Assessment
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{readiness.reasoning}</p>
                </div>
              )}

              {readiness?.missingItems.length > 0 ? (
                <div className="card p-5 animate-fade-in" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Missing Requirements
                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full ml-1">
                      {readiness.missingItems.length} item{readiness.missingItems.length > 1 ? "s" : ""}
                    </span>
                  </h3>
                  <div className="space-y-2.5">
                    {readiness.missingItems.map((item, i) => <MissingRow key={i} item={item} />)}
                  </div>
                </div>
              ) : (
                <div className="card p-5 border-green-200 bg-green-50 animate-fade-in" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
                  <div className="flex items-center gap-2.5 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">All requirements met — cleared to proceed</span>
                  </div>
                </div>
              )}

              {actions.length > 0 && (
                <div className="card p-5 animate-fade-in" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-beacon-600" />
                    Coordination Actions
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full ml-1">
                      {actions.length} dispatched
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {actions.map(a => <ActionCard key={a.id} action={a} />)}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Labs */}
              <div className="card p-4 animate-fade-in" style={{ animationDelay: "0.05s", animationFillMode: "both" }}>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-purple-500" />
                  Lab Results
                </h4>
                <div className="space-y-1.5">
                  {detail.labs.map(lab => (
                    <div key={lab.id} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-600">{lab.type}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        lab.status === "completed" && !lab.isExpired ? "bg-green-100 text-green-700" :
                        lab.isExpired ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                      }`}>
                        {lab.isExpired ? "Expired" : lab.status === "completed" ? "Complete" : "Missing"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Imaging */}
              <div className="card p-4 animate-fade-in" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-blue-500" />
                  Imaging
                </h4>
                <div className="space-y-1.5">
                  {detail.imaging.map(img => (
                    <div key={img.id} className="flex items-center justify-between py-1 gap-2">
                      <span className="text-xs text-gray-600 truncate flex-1">{img.type}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                        img.isExpired ? "bg-orange-100 text-orange-700" :
                        img.status === "completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {img.isExpired ? "Expired" : img.status === "completed" ? "Current" : "Missing"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consent & Clearances */}
              <div className="card p-4 animate-fade-in" style={{ animationDelay: "0.15s", animationFillMode: "both" }}>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-500" />
                  Consent & Clearances
                </h4>
                <div className="space-y-1.5">
                  {detail.consent.map(con => (
                    <div key={con.id} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-600">{con.type} Consent</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        con.status === "signed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {con.status === "signed" ? "Signed" : "Missing"}
                      </span>
                    </div>
                  ))}
                  {detail.clearances.map(clr => (
                    <div key={clr.id} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-600">{clr.specialty}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        clr.status === "cleared" ? "bg-green-100 text-green-700" :
                        clr.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                      }`}>
                        {clr.status.charAt(0).toUpperCase() + clr.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BRIEFING TAB */}
        {tab === "briefing" && briefing && (
          <div className="max-w-3xl animate-fade-in">
            <div className="card p-7">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-5 h-5 text-beacon-600" />
                    <h2 className="text-xl font-bold text-gray-900">Surgical Briefing</h2>
                  </div>
                  <div className="text-xs text-gray-400">
                    Generated by Briefing Generator · {new Date(briefing.generatedAt).toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ReadinessScore score={briefing.readinessScore} size={60} />
                  <StatusBadge status={briefing.readinessStatus} />
                </div>
              </div>

              <div className="bg-surface-50 border border-surface-200 rounded-xl p-5 mb-6">
                <p className="text-gray-700 leading-relaxed text-sm">{briefing.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Key Risks
                  </h4>
                  <ul className="space-y-2">
                    {briefing.keyRisks.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          r.toLowerCase().includes("blocked") || r.toLowerCase().includes("critical") || r.toLowerCase().includes("missing")
                            ? "bg-red-400" : "bg-amber-400"
                        }`} />
                        <span className="text-gray-700 leading-snug">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Anesthesia Considerations</h4>
                  <ul className="space-y-2">
                    {briefing.anesthesiaConsiderations.map((a, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-blue-400" />
                        <span className="text-gray-700 leading-snug">{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {briefing.outstandingItems.length > 0 && (
                <div className="rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-5">
                  <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Outstanding Items — Required Before Proceeding
                  </h4>
                  <ul className="space-y-1.5">
                    {briefing.outstandingItems.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-red-600 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AGENT TRACES TAB */}
        {tab === "agents" && (
          <div className="max-w-3xl animate-fade-in">
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-100 flex items-center gap-2">
                <Brain className="w-4 h-4 text-beacon-600" />
                <div>
                  <div className="font-semibold text-gray-900">Agent Execution Traces</div>
                  <div className="text-xs text-gray-400 mt-0.5">{traces.length} steps recorded for {c.id}</div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {traces.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No traces available</div>
                ) : (
                  traces.map((t, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-4 ${agentColors[t.agentName]?.replace("text-", "border-").replace("bg-", "bg-") ?? "bg-gray-50 border-gray-200"} animate-fade-in bg-opacity-30`}
                      style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "both" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${agentColors[t.agentName] ?? "bg-gray-100 text-gray-600"}`}>
                            {t.agentName}
                          </span>
                          <span className="text-xs text-gray-500 font-medium capitalize">{t.action.replace(/_/g, " ")}</span>
                        </div>
                        <span className="text-xs font-mono text-gray-400 tabular-nums">{t.durationMs}ms</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-1.5">
                        <span className="font-medium text-gray-600">→ </span>{t.input}
                      </div>
                      <div className="text-xs text-gray-700 bg-white/70 rounded-lg px-3 py-2 font-mono leading-relaxed">
                        {t.output}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
