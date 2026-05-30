"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Calendar, Clock, Play, Loader2, ChevronRight,
  CheckCircle, AlertTriangle, XCircle, Sparkles,
  ArrowUpRight, Zap,
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import ReadinessScore from "@/components/ReadinessScore";
import { SurgicalCase, Patient, BeaconRunResult } from "@/lib/types";
import { formatDate, formatTime, formatDuration, getTomorrowDate } from "@/lib/utils";
import demoResults from "@/data/demo-results.json";

interface EnrichedCase extends SurgicalCase { patient: Patient; }

const AGENTS = [
  { label: "Schedule" },
  { label: "Readiness" },
  { label: "Coordination" },
  { label: "Briefing" },
];

function useCountUp(target: number, duration = 800, trigger = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, trigger]);
  return val;
}

export default function ORSchedulePage() {
  const [cases, setCases] = useState<EnrichedCase[]>([]);
  const [results, setResults] = useState<BeaconRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(true);
  const [activeAgent, setActiveAgent] = useState(-1);
  const [runTime, setRunTime] = useState(47.3);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/schedule").then(r => r.json()).then(d => setCases(d.cases));
    setResults(demoResults as unknown as BeaconRunResult);
  }, []);

  const runBeacon = useCallback(async () => {
    setRunning(true);
    setRan(false);
    setActiveAgent(0);
    let t = 0;
    timerRef.current = setInterval(() => { t += 0.1; setRunTime(parseFloat(t.toFixed(1))); }, 100);

    for (let i = 0; i < AGENTS.length; i++) {
      setActiveAgent(i);
      await new Promise(r => setTimeout(r, 900));
    }
    setActiveAgent(-1);

    try {
      const res = await fetch("/api/run-beacon", { method: "POST" });
      const data = await res.json();
      setResults(data);
    } catch {
      setResults(demoResults as unknown as BeaconRunResult);
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setRan(true);
    setRunning(false);
  }, []);

  const source      = results ?? (demoResults as unknown as BeaconRunResult);
  const readyCount  = source?.readyCases  ?? 0;
  const atRiskCount = source?.atRiskCases ?? 0;
  const blockedCount= source?.blockedCases ?? 0;
  const totalCount  = cases.length || 15;

  const readyPct   = useCountUp(ran ? Math.round((readyCount  / totalCount) * 100) : 0, 800,  ran);
  const atRiskPct  = useCountUp(ran ? Math.round((atRiskCount / totalCount) * 100) : 0, 900,  ran);
  const blockedPct = useCountUp(ran ? Math.round((blockedCount/ totalCount) * 100) : 0, 1000, ran);

  const tomorrow = getTomorrowDate();

  return (
    <div className="min-h-screen bg-surface-50">
      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="topbar px-8 py-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold">OR Schedule</div>
              <div className="font-semibold text-gray-900 flex items-center gap-2 mt-0.5">
                <Calendar className="w-4 h-4 text-beacon-600" />
                {formatDate(tomorrow)}
              </div>
            </div>
            <div className="h-8 w-px bg-surface-200" />
            <span className="text-sm text-gray-400">{totalCount} cases</span>
            {ran && (
              <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                Analysis complete · {runTime.toFixed(1)}s
              </span>
            )}
          </div>
          <button onClick={runBeacon} disabled={running} className="btn-beacon">
            {running
              ? <><Loader2 className="w-4 h-4 animate-spin" />Running agents…</>
              : <><Sparkles className="w-4 h-4" />Run Beacon</>
            }
          </button>
        </div>
      </div>

      <div className="px-8 py-7">

        {/* ── Agent progress strip (running state) ──────── */}
        {running && (
          <div className="card p-4 mb-6 border-l-4 border-beacon-600 animate-fade-in">
            <div className="flex items-center gap-3 mb-2.5">
              <Zap className="w-4 h-4 text-beacon-600 animate-pulse" />
              <span className="text-sm font-semibold text-gray-800">
                Beacon agents processing {totalCount} cases
              </span>
              <span className="ml-auto font-mono text-sm text-beacon-600 tabular-nums">
                {runTime.toFixed(1)}s
              </span>
            </div>
            <div className="flex gap-1.5">
              {AGENTS.map((a, i) => (
                <div key={a.label} className="flex-1">
                  <div className={`h-1.5 rounded-full transition-all duration-700 ${
                    i < activeAgent  ? "bg-emerald-500" :
                    i === activeAgent ? "bg-beacon-500 animate-pulse-soft" : "bg-surface-200"
                  }`} />
                  <div className={`text-[10px] mt-1 font-semibold transition-colors ${
                    i < activeAgent  ? "text-emerald-600" :
                    i === activeAgent ? "text-beacon-600" : "text-gray-300"
                  }`}>{a.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── KPI strip ─────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4 mb-7">
          {/* Total */}
          <div className={`card p-5 animate-fade-up stagger-1`} style={{ animationFillMode: "both" }}>
            <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Total Cases</div>
            <div className="text-5xl font-display font-bold text-gray-900 tabular-nums">{totalCount}</div>
            <div className="text-sm text-gray-400 mt-1.5">Tomorrow's OR</div>
          </div>
          {/* Ready */}
          <div className={`card p-5 border-l-4 border-emerald-500 animate-fade-up stagger-2`} style={{ animationFillMode: "both" }}>
            <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Ready</div>
            <div className="text-5xl font-display font-bold text-emerald-600 tabular-nums">{readyCount}</div>
            <div className="text-sm text-gray-400 mt-1.5">{readyPct}% of schedule</div>
          </div>
          {/* At Risk */}
          <div className={`card p-5 border-l-4 border-amber-500 animate-fade-up stagger-3`} style={{ animationFillMode: "both" }}>
            <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">At Risk</div>
            <div className="text-5xl font-display font-bold text-amber-600 tabular-nums">{atRiskCount}</div>
            <div className="text-sm text-gray-400 mt-1.5">{atRiskPct}% — action taken</div>
          </div>
          {/* Blocked */}
          <div className={`card p-5 border-l-4 border-red-500 animate-fade-up stagger-4`} style={{ animationFillMode: "both" }}>
            <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">Blocked</div>
            <div className="text-5xl font-display font-bold text-red-600 tabular-nums">{blockedCount}</div>
            <div className="text-sm text-gray-400 mt-1.5">{blockedPct}% — cannot proceed</div>
          </div>
        </div>

        {/* ── OR Day Timeline ────────────────────────────── */}
        {cases.length > 0 && (
          <div className="card p-5 mb-7">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-gray-900 text-lg">OR Day Timeline</h2>
                <div className="text-xs text-gray-400 mt-0.5">07:30 — 18:00 · 8 operating rooms</div>
              </div>
            </div>
            <div className="relative">
              {["OR-1","OR-2","OR-3","OR-4","OR-5","OR-6","OR-7","OR-8"].map(room => {
                const roomCases = cases.filter(c => c.orRoom.startsWith(room));
                return (
                  <div key={room} className="flex items-center gap-3 mb-1.5">
                    <div className="text-xs font-semibold text-gray-400 w-14 flex-shrink-0 text-right">{room}</div>
                    <div className="flex-1 h-7 bg-surface-100 rounded-lg relative overflow-hidden">
                      {roomCases.map(c => {
                        const startH = parseInt(c.startTime.split(":")[0]);
                        const startM = parseInt(c.startTime.split(":")[1]);
                        const totalMins = (startH * 60 + startM) - 7 * 60 - 30;
                        const dayMins   = 10.5 * 60;
                        const left  = (totalMins / dayMins) * 100;
                        const width = (c.estimatedDuration / dayMins) * 100;
                        const r = source?.results?.[c.id]?.readiness;
                        const color = !r ? "bg-surface-300" :
                          r.status === "ready"   ? "bg-emerald-500" :
                          r.status === "at-risk" ? "bg-amber-500" : "bg-red-500";
                        return (
                          <Link key={c.id} href={`/case/${c.id}`}>
                            <div
                              className={`timeline-bar ${color} hover:opacity-80 transition-opacity cursor-pointer`}
                              style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
                              title={`${c.patient?.name} — ${c.procedure}`}
                            >
                              <span className="hidden xl:block truncate">{c.patient?.name?.split(" ")[1] ?? ""}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="flex mt-2 ml-[68px]">
                {["7:30","9:00","10:30","12:00","13:30","15:00","16:30","18:00"].map(t => (
                  <div key={t} className="flex-1 text-[10px] text-gray-400 tabular-nums">{t}</div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-5 mt-3 pt-3 border-t border-surface-100">
              {[
                ["Ready",   "bg-emerald-500"],
                ["At Risk", "bg-amber-500"],
                ["Blocked", "bg-red-500"],
                ["Pending", "bg-surface-300"],
              ].map(([l, c]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${c}`} />
                  <span className="text-xs text-gray-500 font-medium">{l}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Case table ────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-gray-900 text-lg">Scheduled Cases</h2>
              <div className="text-xs text-gray-400 mt-0.5">
                Sorted by start time · click any row for full case detail
              </div>
            </div>
            {ran && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <CheckCircle className="w-3 h-3" />
                Beacon complete
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time / Room</th>
                  <th>Patient</th>
                  <th>Procedure</th>
                  <th>Surgeon</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th className="text-center">Score</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cases.map((c, idx) => {
                  const r = source?.results?.[c.id]?.readiness;
                  const rowBg =
                    r?.status === "blocked"  ? "bg-red-50/30" :
                    r?.status === "at-risk"  ? "bg-amber-50/25" : "";
                  return (
                    <tr
                      key={c.id}
                      className={`${rowBg} animate-fade-in`}
                      style={{ animationDelay: `${idx * 0.03}s`, animationFillMode: "both" }}
                    >
                      <td>
                        <div className="flex items-center gap-1.5 font-semibold text-gray-900 tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                          {formatTime(c.startTime)}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 font-medium">{c.orRoom}</div>
                      </td>
                      <td>
                        <div className="font-semibold text-gray-900">{c.patient?.name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{c.patient?.mrn}</div>
                      </td>
                      <td>
                        <div className="text-gray-800 max-w-[200px] truncate font-medium">{c.procedure}</div>
                        <div className="text-xs text-gray-400 capitalize mt-0.5">{c.anesthesiaType} · {c.priority}</div>
                      </td>
                      <td>
                        <div className="text-gray-600 text-sm">{c.surgeon}</div>
                      </td>
                      <td>
                        <div className="font-semibold text-gray-700 tabular-nums">{formatDuration(c.estimatedDuration)}</div>
                      </td>
                      <td>
                        {r
                          ? <StatusBadge status={r.status} />
                          : <span className="text-xs text-gray-300 italic">Pending</span>
                        }
                      </td>
                      <td className="text-center">
                        {r
                          ? <ReadinessScore score={r.score} size={40} showLabel={false} />
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td>
                        <Link
                          href={`/case/${c.id}`}
                          className="flex items-center gap-1 text-xs text-beacon-600 hover:text-beacon-700 font-semibold group"
                        >
                          View
                          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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
    </div>
  );
}
