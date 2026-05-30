"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import {
  ArrowLeft,
  AlertTriangle,
  XCircle,
  CheckCircle,
  FlaskConical,
  ScanLine,
  FileText,
  UserCheck,
  MessageSquare,
  Zap,
  Clock,
  User,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import ReadinessScore from "@/components/ReadinessScore";
import AgentActivityFeed from "@/components/AgentActivityFeed";
import { CaseDetail, MissingItem, CoordinationAction } from "@/lib/types";
import { formatTime, formatDuration, severityToColor } from "@/lib/utils";

const typeIcons = {
  lab: FlaskConical,
  imaging: ScanLine,
  consent: FileText,
  clearance: UserCheck,
};

const actionTypeLabels: Record<CoordinationAction["type"], string> = {
  escalate: "Escalated",
  notify_surgeon: "Surgeon Notified",
  notify_nurse: "Nursing Notified",
  notify_anesthesia: "Anesthesia Notified",
  create_ticket: "Ticket Created",
  send_reminder: "Reminder Sent",
};

const priorityColors: Record<CoordinationAction["priority"], string> = {
  critical: "border-red-300 bg-red-50",
  high: "border-amber-300 bg-amber-50",
  medium: "border-blue-300 bg-blue-50",
};

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "briefing" | "agents">("overview");

  useEffect(() => {
    fetch(`/api/cases/${id}`)
      .then((r) => r.json())
      .then(setDetail);
  }, [id]);

  if (!detail) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <div className="text-gray-400">Loading case details…</div>
      </div>
    );
  }

  const { case: c, patient, readiness, actions, briefing, traces } = detail;

  const MissingItemRow = ({ item }: { item: MissingItem }) => {
    const Icon = typeIcons[item.type];
    return (
      <div className={`flex items-start gap-3 p-3 rounded-lg border ${
        item.severity === "critical" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
      }`}>
        <div className={`mt-0.5 ${severityToColor(item.severity)}`}>
          {item.severity === "critical" ? <XCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">{item.name}</span>
            <span className={`text-xs font-medium capitalize ${severityToColor(item.severity)}`}>
              {item.severity}
            </span>
          </div>
          <div className="text-xs text-gray-600 mt-1">{item.description}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8">
      <Link
        href="/"
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to OR Schedule
      </Link>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{patient?.name}</div>
              <div className="text-sm text-gray-500 mt-0.5">
                {patient?.mrn} · Age {patient?.age} {patient?.gender} · BMI {patient?.bmi}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {patient?.comorbidities?.map((c) => (
                  <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{c}</span>
                ))}
              </div>
              {patient?.allergies?.length > 0 && (
                <div className="mt-1.5 text-xs text-red-600 font-medium">
                  ⚠ Allergies: {patient.allergies.join(", ")}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            {readiness && <ReadinessScore score={readiness.score} size={72} />}
            {readiness && <StatusBadge status={readiness.status} />}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Procedure</div>
            <div className="text-sm font-medium text-gray-900 mt-1">{c.procedure}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Surgeon</div>
            <div className="text-sm font-medium text-gray-900 mt-1">{c.surgeon}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Time / Room</div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">{formatTime(c.startTime)}</span>
              <span className="text-gray-400">·</span>
              <span className="text-sm text-gray-700">{c.orRoom}</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase">Duration</div>
            <div className="text-sm font-medium text-gray-900 mt-1">{formatDuration(c.estimatedDuration)}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(["overview", "briefing", "agents"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab === "agents" ? "Agent Traces" : tab === "briefing" ? "Surgical Briefing" : "Readiness Overview"}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {readiness && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Readiness Assessment</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{readiness.reasoning}</p>
              </div>
            )}

            {readiness && readiness.missingItems.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Missing Requirements ({readiness.missingItems.length})
                </h3>
                <div className="space-y-2">
                  {readiness.missingItems.map((item, i) => (
                    <MissingItemRow key={i} item={item} />
                  ))}
                </div>
              </div>
            )}

            {readiness && readiness.missingItems.length === 0 && (
              <div className="card p-5 border-green-200 bg-green-50">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">All requirements met — ready to proceed</span>
                </div>
              </div>
            )}

            {actions.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-beacon-blue" />
                  Coordination Actions ({actions.length})
                </h3>
                <div className="space-y-3">
                  {actions.map((action) => (
                    <div key={action.id} className={`rounded-lg border p-3 ${priorityColors[action.priority]}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700 uppercase">
                          {actionTypeLabels[action.type]}
                        </span>
                        <span className={`text-xs font-medium capitalize ${
                          action.priority === "critical" ? "text-red-600" :
                          action.priority === "high" ? "text-amber-600" : "text-blue-600"
                        }`}>
                          {action.priority}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-gray-800 mb-1">→ {action.target}</div>
                      <div className="text-xs text-gray-600 leading-relaxed">{action.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Labs</h3>
              <div className="space-y-2">
                {detail.labs.map((lab) => (
                  <div key={lab.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{lab.type}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      lab.status === "completed" && !lab.isExpired ? "bg-green-100 text-green-700" :
                      lab.isExpired ? "bg-orange-100 text-orange-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {lab.isExpired ? "Expired" : lab.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Imaging</h3>
              <div className="space-y-2">
                {detail.imaging.map((img) => (
                  <div key={img.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 text-xs">{img.type}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      img.isExpired ? "bg-orange-100 text-orange-700" :
                      img.status === "completed" ? "bg-green-100 text-green-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {img.isExpired ? "Expired" : img.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Consent & Clearances</h3>
              <div className="space-y-2">
                {detail.consent.map((con) => (
                  <div key={con.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{con.type} Consent</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      con.status === "signed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {con.status}
                    </span>
                  </div>
                ))}
                {detail.clearances.map((clr) => (
                  <div key={clr.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{clr.specialty}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      clr.status === "cleared" ? "bg-green-100 text-green-700" :
                      clr.status === "pending" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {clr.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "briefing" && briefing && (
        <div className="max-w-3xl">
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-beacon-blue" />
              <h2 className="text-lg font-bold text-gray-900">Surgical Briefing</h2>
              <StatusBadge status={briefing.readinessStatus} />
            </div>

            <div className="prose prose-sm max-w-none">
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-gray-700 leading-relaxed">{briefing.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Key Risks
                  </h4>
                  <ul className="space-y-1.5">
                    {briefing.keyRisks.map((r, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-gray-300 mt-1">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Anesthesia Considerations</h4>
                  <ul className="space-y-1.5">
                    {briefing.anesthesiaConsiderations.map((a, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-gray-300 mt-1">•</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {briefing.outstandingItems.length > 0 && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Outstanding Items — Required Before Proceeding
                  </h4>
                  <ul className="space-y-1">
                    {briefing.outstandingItems.map((item, i) => (
                      <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                        <span className="mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <ReadinessScore score={briefing.readinessScore} size={64} />
                <div>
                  <div className="font-semibold text-gray-900">Readiness Score: {briefing.readinessScore}/100</div>
                  <div className="text-sm text-gray-500">Generated at {new Date(briefing.generatedAt).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "agents" && (
        <div className="max-w-3xl">
          <AgentActivityFeed traces={traces} title={`Agent Traces — ${c.id}`} />
        </div>
      )}
    </div>
  );
}
