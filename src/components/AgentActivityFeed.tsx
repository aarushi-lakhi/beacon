"use client";
import { AgentTrace } from "@/lib/types";
import { Brain, Clock } from "lucide-react";

const agentColors: Record<string, string> = {
  "Schedule Monitor": "bg-blue-100 text-blue-700",
  "Readiness Reviewer": "bg-purple-100 text-purple-700",
  "Care Coordinator": "bg-orange-100 text-orange-700",
  "Briefing Generator": "bg-teal-100 text-teal-700",
};

interface Props {
  traces: AgentTrace[];
  title?: string;
}

export default function AgentActivityFeed({ traces, title = "Agent Activity" }: Props) {
  if (traces.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-beacon-blue" />
          {title}
        </h3>
        <p className="text-sm text-gray-400 text-center py-6">
          Run Beacon to see agent activity
        </p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Brain className="w-4 h-4 text-beacon-blue" />
        {title}
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin pr-1">
        {traces.map((trace, i) => (
          <div key={i} className="flex gap-3 animate-fade-in">
            <div className="flex-shrink-0 mt-0.5">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                  agentColors[trace.agentName] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {trace.agentName.split(" ")[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-700 capitalize">
                {trace.action.replace(/_/g, " ")}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                {trace.output}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {trace.durationMs}ms
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
