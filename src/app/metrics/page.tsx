"use client";
import { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, XCircle, Shield, Clock } from "lucide-react";
import { ExecutiveMetrics } from "@/lib/types";

const interventionData = [
  { type: "Cardiology Escalation", count: 2, resolved: 1 },
  { type: "Consent Follow-up",     count: 1, resolved: 0 },
  { type: "Lab Orders",            count: 3, resolved: 2 },
  { type: "Nursing Alerts",        count: 4, resolved: 4 },
  { type: "OR Schedule Hold",      count: 2, resolved: 1 },
];

function AnimatedNumber({
  target,
  duration = 1000,
  prefix = "",
  suffix = "",
}: {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return <span>{prefix}{val}{suffix}</span>;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);

  useEffect(() => {
    fetch("/api/metrics").then(r => r.json()).then(setMetrics);
  }, []);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-50">
        <div className="text-gray-400 text-sm animate-pulse-soft">Loading metrics…</div>
      </div>
    );
  }

  const readyPct    = Math.round((metrics.readyCases   / metrics.casesReviewed) * 100);
  const atRiskPct   = Math.round((metrics.atRiskCases  / metrics.casesReviewed) * 100);
  const blockedPct  = Math.round((metrics.blockedCases / metrics.casesReviewed) * 100);
  const estSavings  = Math.round(metrics.estimatedORTimeSavedMinutes * 62);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="topbar px-8 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="font-bold text-gray-900 text-xl"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              Executive Metrics
            </h1>
            <div className="text-xs text-gray-400 mt-0.5">
              Last Beacon run · {metrics.lastRunAt ? new Date(metrics.lastRunAt).toLocaleTimeString() : "—"}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <Shield className="w-3.5 h-3.5" />
            HIPAA Compliant · Synthetic Data
          </div>
        </div>
      </div>

      <div className="px-8 py-7 space-y-7">

        {/* ── Hero KPIs ─────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-5">
          {[
            {
              label:  "Cases Reviewed",
              value:  metrics.casesReviewed,
              sub:    `of ${metrics.totalCasesTomorrow} scheduled`,
              color:  "text-gray-900",
            },
            {
              label:  "Cancellation Risk",
              value:  metrics.cancellationRiskPercent,
              suffix: "%",
              sub:    "Blocked + at-risk cases",
              color:  metrics.cancellationRiskPercent > 20 ? "text-red-600" : "text-amber-600",
            },
            {
              label:  "Actions Dispatched",
              value:  metrics.actionsSent,
              sub:    "Escalations, notifications",
              color:  "text-purple-600",
            },
            {
              label:  "OR Time Protected",
              value:  metrics.estimatedORTimeSavedMinutes,
              suffix: "min",
              sub:    "Early detection benefit",
              color:  "text-emerald-600",
            },
          ].map(({ label, value, suffix = "", sub, color }, i) => (
            <div
              key={label}
              className={`card p-6 animate-fade-up stagger-${i + 1}`}
              style={{ animationFillMode: "both" }}
            >
              <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">
                {label}
              </div>
              <div className={`text-5xl font-display font-bold tabular-nums ${color}`}>
                <AnimatedNumber target={value} suffix={suffix} />
              </div>
              <div className="text-sm text-gray-400 mt-2">{sub}</div>
            </div>
          ))}
        </div>

        {/* ── Status breakdown — solid sticker blocks ───── */}
        <div className="grid grid-cols-3 gap-5">
          <div className="rounded-2xl p-7 bg-emerald-600 text-white animate-fade-up stagger-1" style={{ animationFillMode: "both" }}>
            <div className="flex items-center gap-2 mb-4 opacity-80">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Ready</span>
            </div>
            <div className="text-6xl font-display font-bold tabular-nums mb-1">
              <AnimatedNumber target={metrics.readyCases} />
            </div>
            <div className="text-4xl font-display font-bold opacity-70 tabular-nums">
              {readyPct}%
            </div>
            <div className="text-sm mt-3 opacity-70 font-medium">cleared to proceed</div>
          </div>

          <div className="rounded-2xl p-7 bg-amber-500 text-white animate-fade-up stagger-2" style={{ animationFillMode: "both" }}>
            <div className="flex items-center gap-2 mb-4 opacity-80">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">At Risk</span>
            </div>
            <div className="text-6xl font-display font-bold tabular-nums mb-1">
              <AnimatedNumber target={metrics.atRiskCases} />
            </div>
            <div className="text-4xl font-display font-bold opacity-70 tabular-nums">
              {atRiskPct}%
            </div>
            <div className="text-sm mt-3 opacity-80 font-medium">action dispatched</div>
          </div>

          <div className="rounded-2xl p-7 bg-red-600 text-white animate-fade-up stagger-3" style={{ animationFillMode: "both" }}>
            <div className="flex items-center gap-2 mb-4 opacity-80">
              <XCircle className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-widest">Blocked</span>
            </div>
            <div className="text-6xl font-display font-bold tabular-nums mb-1">
              <AnimatedNumber target={metrics.blockedCases} />
            </div>
            <div className="text-4xl font-display font-bold opacity-70 tabular-nums">
              {blockedPct}%
            </div>
            <div className="text-sm mt-3 opacity-80 font-medium">cannot proceed</div>
          </div>
        </div>

        {/* ── Intervention types + Business impact row ───── */}
        <div className="grid grid-cols-2 gap-5">

          {/* Intervention types */}
          <div className="card p-6">
            <h3
              className="font-bold text-gray-900 text-lg mb-1"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              Intervention Types
            </h3>
            <div className="text-xs text-gray-400 mb-5">Actions dispatched by Care Coordinator</div>
            <div className="space-y-4">
              {interventionData.map(row => (
                <div key={row.type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-gray-700">{row.type}</span>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="text-emerald-600">{row.resolved} resolved</span>
                      <span className="text-gray-300">/ {row.count}</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill bg-emerald-500"
                      style={{
                        width: `${(row.resolved / row.count) * 100}%`,
                        transition: "width 1.2s ease-out",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business impact */}
          <div className="card p-6">
            <h3
              className="font-bold text-gray-900 text-lg mb-1"
              style={{ fontFamily: "Fraunces, Georgia, serif" }}
            >
              Business Impact
            </h3>
            <div className="text-xs text-gray-400 mb-5">Estimated value from today's Beacon run</div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "OR Time Protected",
                  value: `${metrics.estimatedORTimeSavedMinutes}min`,
                  sub:   "Early identification",
                  color: "text-beacon-600",
                  bg:    "bg-beacon-50",
                },
                {
                  label: "Est. Cost Savings",
                  value: `$${estSavings.toLocaleString()}`,
                  sub:   "At $62/min OR cost",
                  color: "text-emerald-600",
                  bg:    "bg-emerald-50",
                },
                {
                  label: "Automation Rate",
                  value: "100%",
                  sub:   "Zero manual work",
                  color: "text-purple-600",
                  bg:    "bg-purple-50",
                },
                {
                  label: "Cases Cleared",
                  value: `${readyPct}%`,
                  sub:   `${metrics.readyCases} of ${metrics.casesReviewed} ready`,
                  color: "text-emerald-600",
                  bg:    "bg-emerald-50",
                },
              ].map(({ label, value, sub, color, bg }) => (
                <div key={label} className={`rounded-xl p-4 ${bg}`}>
                  <div className={`text-2xl font-display font-bold ${color} tabular-nums`}>{value}</div>
                  <div className="text-xs font-bold text-gray-700 mt-1">{label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-surface-100 flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              Analysis completed in {metrics.runDurationSeconds?.toFixed(1) ?? "47.3"}s · {metrics.agentsUsed ?? 4} agents
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
