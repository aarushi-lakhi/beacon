"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Play,
  Loader2,
  ChevronRight,
  Stethoscope,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import ReadinessScore from "@/components/ReadinessScore";
import StatsCard from "@/components/StatsCard";
import { SurgicalCase, Patient, ReadinessResult, BeaconRunResult } from "@/lib/types";
import { formatDate, formatTime, formatDuration, getTomorrowDate } from "@/lib/utils";
import demoResults from "@/data/demo-results.json";

interface EnrichedCase extends SurgicalCase {
  patient: Patient;
}

export default function ORSchedulePage() {
  const [cases, setCases] = useState<EnrichedCase[]>([]);
  const [results, setResults] = useState<BeaconRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);

  useEffect(() => {
    fetch("/api/schedule")
      .then((r) => r.json())
      .then((d) => setCases(d.cases));
  }, []);

  const runBeacon = useCallback(async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/run-beacon", { method: "POST" });
      const data = await res.json();
      setResults(data);
      setRan(true);
    } finally {
      setRunning(false);
    }
  }, []);

  const getReadiness = (caseId: string): ReadinessResult | null => {
    const source = results ?? (demoResults as unknown as BeaconRunResult);
    return source?.results?.[caseId]?.readiness ?? null;
  };

  const tomorrow = getTomorrowDate();
  const readyCount = ran
    ? results?.readyCases ?? 0
    : (demoResults as unknown as BeaconRunResult).readyCases;
  const atRiskCount = ran
    ? results?.atRiskCases ?? 0
    : (demoResults as unknown as BeaconRunResult).atRiskCases;
  const blockedCount = ran
    ? results?.blockedCases ?? 0
    : (demoResults as unknown as BeaconRunResult).blockedCases;

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(tomorrow)}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">OR Schedule</h1>
          <p className="text-gray-500 mt-1">
            {cases.length} cases scheduled · Beacon surgical readiness platform
          </p>
        </div>
        <button
          onClick={runBeacon}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 bg-beacon-blue text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running Beacon…
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Beacon Analysis
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Cases" value={cases.length} icon={Stethoscope} color="blue" sub="Tomorrow's OR" />
        <StatsCard label="Ready" value={readyCount} icon={CheckCircle} color="green" sub="All requirements met" />
        <StatsCard label="At Risk" value={atRiskCount} icon={AlertTriangle} color="amber" sub="Action needed" />
        <StatsCard label="Blocked" value={blockedCount} icon={XCircle} color="red" sub="Cannot proceed" />
      </div>

      {running && (
        <div className="card p-6 mb-6 border-beacon-blue/30 bg-blue-50">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-beacon-blue animate-spin" />
            <div>
              <div className="font-semibold text-beacon-blue">Beacon agents running…</div>
              <div className="text-sm text-blue-600 mt-0.5">
                Schedule Monitor → Readiness Reviewer → Care Coordinator → Briefing Generator
              </div>
            </div>
          </div>
        </div>
      )}

      {ran && (
        <div className="card p-4 mb-6 border-green-300 bg-green-50">
          <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
            <CheckCircle className="w-4 h-4" />
            Beacon analysis complete · {results?.casesProcessed} cases reviewed · {results?.totalActions} actions dispatched
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Scheduled Cases</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time / Room</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Procedure</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Surgeon</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Duration</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cases.map((c) => {
                const readiness = getReadiness(c.id);
                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      c.demoHighlight ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {formatTime(c.startTime)}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{c.orRoom}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{c.patient?.name}</div>
                      <div className="text-xs text-gray-400">{c.patient?.mrn}</div>
                      {c.demoHighlight && (
                        <div className="text-xs text-beacon-blue font-medium mt-0.5">{c.demoLabel}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800 max-w-[220px] truncate">{c.procedure}</div>
                      <div className="text-xs text-gray-400 mt-0.5 capitalize">{c.priority} · {c.anesthesiaType}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">{c.surgeon}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">{formatDuration(c.estimatedDuration)}</div>
                    </td>
                    <td className="px-6 py-4">
                      {readiness ? (
                        <StatusBadge status={readiness.status} />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {readiness ? (
                        <ReadinessScore score={readiness.score} size={44} showLabel={false} />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/case/${c.id}`}
                        className="flex items-center gap-1 text-xs text-beacon-blue hover:text-blue-800 font-medium"
                      >
                        Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
