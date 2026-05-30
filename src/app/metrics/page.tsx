"use client";
import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Stethoscope,
  Activity,
} from "lucide-react";
import StatsCard from "@/components/StatsCard";
import { ExecutiveMetrics } from "@/lib/types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const COLORS = { ready: "#057a55", "at-risk": "#d97706", blocked: "#dc2626" };

const historicalData = [
  { week: "Wk 1", ready: 12, atRisk: 3, blocked: 1 },
  { week: "Wk 2", ready: 10, atRisk: 4, blocked: 2 },
  { week: "Wk 3", ready: 14, atRisk: 2, blocked: 1 },
  { week: "Wk 4", ready: 11, atRisk: 5, blocked: 2 },
  { week: "Today", ready: 9, atRisk: 4, blocked: 2 },
];

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then(setMetrics);
  }, []);

  if (!metrics) {
    return (
      <div className="p-8 flex items-center justify-center h-96">
        <div className="text-gray-400">Loading metrics…</div>
      </div>
    );
  }

  const pieData = [
    { name: "Ready", value: metrics.readyCases, color: COLORS.ready },
    { name: "At Risk", value: metrics.atRiskCases, color: COLORS["at-risk"] },
    { name: "Blocked", value: metrics.blockedCases, color: COLORS.blocked },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-beacon-blue" />
          <h1 className="text-2xl font-bold text-gray-900">Executive Metrics</h1>
        </div>
        <p className="text-gray-500">
          Beacon operational summary · Last run:{" "}
          {metrics.lastRunAt
            ? new Date(metrics.lastRunAt).toLocaleTimeString()
            : "—"}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Cases Reviewed"
          value={metrics.casesReviewed}
          icon={Stethoscope}
          color="blue"
          sub={`of ${metrics.totalCasesTomorrow} scheduled`}
        />
        <StatsCard
          label="Cancellation Risk"
          value={`${metrics.cancellationRiskPercent}%`}
          icon={TrendingUp}
          color={metrics.cancellationRiskPercent > 20 ? "red" : "amber"}
          sub="Based on blocked + at-risk cases"
        />
        <StatsCard
          label="Actions Dispatched"
          value={metrics.actionsSent}
          icon={MessageSquare}
          color="purple"
          sub="Escalations, notifications, tickets"
        />
        <StatsCard
          label="OR Time Protected"
          value={`${metrics.estimatedORTimeSavedMinutes}min`}
          icon={Clock}
          color="green"
          sub="Estimated from early detection"
        />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="card p-3 border-l-4 border-green-500 flex items-center gap-4">
          <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-green-600">{metrics.readyCases}</div>
            <div className="text-sm text-gray-500">Ready to proceed</div>
          </div>
        </div>
        <div className="card p-3 border-l-4 border-amber-500 flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-amber-500 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-amber-600">{metrics.atRiskCases}</div>
            <div className="text-sm text-gray-500">At risk — action taken</div>
          </div>
        </div>
        <div className="card p-3 border-l-4 border-red-500 flex items-center gap-4">
          <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
          <div>
            <div className="text-2xl font-bold text-red-600">{metrics.blockedCases}</div>
            <div className="text-sm text-gray-500">Blocked — cannot proceed</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-beacon-blue" />
            Today&apos;s Readiness Distribution
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-beacon-blue" />
            Weekly Readiness Trend
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={historicalData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="ready" name="Ready" fill={COLORS.ready} radius={[3, 3, 0, 0]} />
              <Bar dataKey="atRisk" name="At Risk" fill={COLORS["at-risk"]} radius={[3, 3, 0, 0]} />
              <Bar dataKey="blocked" name="Blocked" fill={COLORS.blocked} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-6 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">Business Impact Summary</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-beacon-blue">{metrics.estimatedORTimeSavedMinutes}</div>
            <div className="text-sm text-gray-500 mt-1">Minutes of OR time protected</div>
            <div className="text-xs text-gray-400 mt-0.5">
              ~${Math.round(metrics.estimatedORTimeSavedMinutes * 62).toLocaleString()} estimated OR cost savings
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{metrics.actionsSent}</div>
            <div className="text-sm text-gray-500 mt-1">Coordination actions dispatched</div>
            <div className="text-xs text-gray-400 mt-0.5">Automated by Beacon agents</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {Math.round((metrics.readyCases / metrics.casesReviewed) * 100)}%
            </div>
            <div className="text-sm text-gray-500 mt-1">Cases cleared for surgery</div>
            <div className="text-xs text-gray-400 mt-0.5">Readiness success rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
