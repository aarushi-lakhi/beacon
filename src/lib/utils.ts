import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ReadinessStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusColor(status: ReadinessStatus) {
  switch (status) {
    case "ready":
      return {
        bg: "bg-status-ready-bg",
        text: "text-status-ready-text",
        dot: "bg-green-500",
        border: "border-green-300",
      };
    case "at-risk":
      return {
        bg: "bg-status-risk-bg",
        text: "text-status-risk-text",
        dot: "bg-amber-500",
        border: "border-amber-300",
      };
    case "blocked":
      return {
        bg: "bg-status-blocked-bg",
        text: "text-status-blocked-text",
        dot: "bg-red-500",
        border: "border-red-300",
      };
  }
}

export function getScoreColor(score: number): string {
  if (score >= 85) return "#057a55";
  if (score >= 60) return "#d97706";
  return "#dc2626";
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
}

export function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const totalMinutes = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
}

export function statusLabel(status: ReadinessStatus): string {
  switch (status) {
    case "ready": return "Ready";
    case "at-risk": return "At Risk";
    case "blocked": return "Blocked";
  }
}

export function severityToColor(severity: "critical" | "warning"): string {
  return severity === "critical" ? "text-red-600" : "text-amber-600";
}
