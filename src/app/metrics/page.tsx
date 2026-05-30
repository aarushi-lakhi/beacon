"use client";
import { useEffect, useState } from "react";
import {
  BarChart3, TrendingUp, Clock, CheckCircle,
  AlertTriangle, XCircle, MessageSquare, Activity,
  Stethoscope, DollarSign, Zap, Shield,
} from "lucide-react";
import { ExecutiveMetrics } from "@/lib/types";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  CartesianGrid, LineChart, Line, Area, AreaChart,
} from "recharts";

const COLORS = { ready: "#059669", "at-risk": "#d97706", blocked: "#dc2626" };

const historicalData = [
  { day: "Mon", ready: 12, atRisk: 3, blocked: 1, rate: 75 },
  { day: "Tue", ready: 10, atRisk: 4, blocked: 2, rate: 63 },
  { day: "Wed", ready: 14, atRisk: 2, blocked: 1, rate: 82 },
  { day: "Thu", ready: 11, atRisk: 5, blocked: 2, rate: 61 },
  { day: "Fri", ready: 13, atRisk: 3, blocked: 1, rate: 76 },
  { day: "Today", ready: 9, atRisk: 4, blocked: 2, rate: 60 },
];

const interventionData = [
  { type: "Cardiology Escalation", count: 2, resolved: 1 },
  { type: "Consent Follow-up", count: 1, resolved: 0 },
  { type: "Lab Orders", count: 3, resolved: 2 },
  { type: "Nursing Alerts", count: 4, resolved: 4 },
  { type: "OR Schedule Hold", count: 2, resolved: 1 },
];

function AnimatedNumber({ target, duration = 1000, prefix = "", suffix = "" }: { target: number; duration?: number; prefix?: string; suffix?: string }) {
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400 text-sm animate-pulse">Loading metrics…</div>
      </div>
    );
  }

  const pieData = [
    { name: "Ready", value: metrics.readyCases, color: COLORS.ready },
    { name: "At Risk", value: metrics.atRiskCases, color: COLORS["at-risk"] },
    { name: "Blocked", value: metrics.blockedCases, color: COLORS.blocked },
  ];

  const readyPct = Math.round((metrics.readyCases / metrics.casesReviewed) * 100);

  return (
    <div className="min-h-screen bg-surface-50 bg-mesh">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-surface-200 px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-beacon-600" />
            <div>
              <h1 className="font-bold text-gray-900">Executive Metrics</h1>
              <div className="text-xs text-gray-400">
                Last Beacon run · {metrics.lastRunAt ? new Date(metrics.lastRunAt).toLocaleTimeString() : "—"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
            <Shield className="w-3.5 h-3.5" />
            HIPAA Compliant · Synthetic Data
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Hero KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: Stethoscope, label: "Cases Reviewed", value: metrics.casesReviewed, sub: `of ${metrics.totalCasesTomorrow} scheduled`, color: "text-beacon-600", bg: "bg-beacon-50" },
            { icon: TrendingUp, label: "Cancellation Risk", value: metrics.cancellationRiskPercent, suffix: "%", sub: "Based on blocked + at-risk", color: metrics.cancellationRiskPercent > 20 ? "text-status-blocked" : "text-status-risk", bg: metrics.cancellationRiskPercent > 20 ? "bg-status-blocked-bg" : "bg-status-risk-bg" },
            { icon: MessageSquare, label: "Actions Dispatched", value: metrics.actionsSent, sub: "Escalations, notifications, tickets", color: "text-purple-600", bg: "bg-purple-50" },
            { icon: Clock, label: "OR Time Protected", value: metrics.estimatedORTimeSavedMinutes, suffix: "min", sub: "Early detection benefit", color: "text-status-ready", bg: "bg-status-ready-bg" },
          ].map(({ icon: Icon, label, value, suffix = "", sub, color, bg }, i) => (
            <div key={label} className={`card p-5 animate-fade-up stagger-${i+1}`} style={{ animationFillMode: "both" }}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4.5 h-4.5 ${color}`} style={{ width: 18, height: 18 }} />
                </div>
              </div>
              <div className={`text-3xl font-bold ${color} tabular-nums`}>
                <AnimatedNumber target={value} suffix={suffix} />
              </div>
              <div className="font-semibold text-gray-700 text-sm mt-1">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* Status breakdown row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: CheckCircle, label: "Ready to Proceed", count: metrics.readyCases, color: "text-status-ready", border: "border-l-4 border-status-ready", pct: readyPct },
            { icon: AlertTriangle, label: "At Risk — Actions Taken", count: metrics.atRiskCases, color: "text-status-risk", border: "border-l-4 border-status-risk", pct: Math.round((metrics.atRiskCases / metrics.casesReviewed) * 100) },
            { icon: XCircle, label: "Blocked — Cannot Proceed", count: metrics.blockedCases, color: "text-status-blocked", border: "border-l-4 border-status-blocked", pct: Math.round((metrics.blockedCases / metrics.casesReviewed) * 100) },
          ].map(({ icon: Icon, label, count, color, border, pct }) => (
            <div key={label} className={`card p-4 flex items-center gap-4 ${border}`}>
              <Icon className={`w-8 h-8 ${color} flex-shrink-0`} />
              <div className="flex-1">
                <div className={`text-2xl font-bold ${color} tabular-nums`}>
                  <AnimatedNumber target={count} />
                </div>
                <div className="text-sm text-gray-500 font-medium">{label}</div>
                <div className="progress-bar mt-2">
                  <div className={`progress-fill ${color === "text-status-ready" ? "bg-status-ready" : color === "text-status-risk" ? "bg-status-risk" : "bg-status-blocked"}`}
                    style={{ width: `${pct}%`, transition: "width 1.2s ease-out" }} />
                </div>
              </div>
              <div className={`text-2xl font-bold ${color} tabular-nums flex-shrink-0`}>{pct}%</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-beacon-600" />
              Today&apos;s Distribution
            </h3>
            <div className="text-xs text-gray-400 mb-4">{metrics.casesReviewed} cases reviewed</div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map(e => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} cases`]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5 col-span-2">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4 text-beacon-600" />
              Weekly Case Readiness Trend
            </h3>
            <div className="text-xs text-gray-400 mb-4">Last 6 days</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={historicalData} barSize={14} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="ready" name="Ready" fill={COLORS.ready} radius={[3,3,0,0]} />
                <Bar dataKey="atRisk" name="At Risk" fill={COLORS["at-risk"]} radius={[3,3,0,0]} />
                <Bar dataKey="blocked" name="Blocked" fill={COLORS.blocked} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Readiness rate trend + Interventions */}
        <div className="grid grid-cols-2 gap-5">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-beacon-600" />
              Readiness Rate (%)
            </h3>
            <div className="text-xs text-gray-400 mb-4">Cases cleared on first Beacon review</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="readyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v}%`, "Ready Rate"]} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }} />
                <Area type="monotone" dataKey="rate" stroke="#059669" strokeWidth={2.5} fill="url(#readyGrad)" dot={{ r: 3, fill: "#059669" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-beacon-600" />
              Intervention Types
            </h3>
            <div className="text-xs text-gray-400 mb-4">Actions dispatched by Care Coordinator</div>
            <div className="space-y-2.5">
              {interventionData.map(row => (
                <div key={row.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{row.type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-600 font-semibold">{row.resolved} resolved</span>
                      <span className="text-xs text-gray-400">/ {row.count}</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill bg-beacon-500" style={{ width: `${(row.resolved / row.count) * 100}%`, transition: "width 1s ease-out" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Business impact */}
        <div className="card p-6 bg-gradient-to-r from-beacon-50 to-blue-50 border-beacon-200">
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-beacon-600" />
            Business Impact Summary
          </h3>
          <div className="grid grid-cols-4 gap-5">
            {[
              { label: "OR Time Protected", value: `${metrics.estimatedORTimeSavedMinutes}min`, sub: "Early identification of blocked cases", color: "text-beacon-600" },
              { label: "Est. Cost Savings", value: `$${Math.round(metrics.estimatedORTimeSavedMinutes * 62).toLocaleString()}`, sub: "At $62/min average OR cost", color: "text-green-600" },
              { label: "Automation Rate", value: "100%", sub: "Zero manual coordinator work", color: "text-purple-600" },
              { label: "Cases Cleared", value: `${readyPct}%`, sub: `${metrics.readyCases} of ${metrics.casesReviewed} ready to proceed`, color: "text-status-ready" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="text-center bg-white rounded-xl p-4 shadow-card">
                <div className={`text-2xl font-bold ${color} tabular-nums`}>{value}</div>
                <div className="font-semibold text-gray-700 text-sm mt-1">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
