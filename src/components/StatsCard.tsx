import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: "blue" | "green" | "amber" | "red" | "purple";
  sub?: string;
}

const colorMap = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600", value: "text-blue-700" },
  green: { bg: "bg-green-50", icon: "text-green-600", value: "text-green-700" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", value: "text-amber-700" },
  red: { bg: "bg-red-50", icon: "text-red-600", value: "text-red-700" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", value: "text-purple-700" },
};

export default function StatsCard({ label, value, icon: Icon, color = "blue", sub }: Props) {
  const c = colorMap[color];
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-gray-500">{label}</div>
          <div className={cn("text-3xl font-bold mt-1", c.value)}>{value}</div>
          {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", c.bg)}>
          <Icon className={cn("w-5 h-5", c.icon)} />
        </div>
      </div>
    </div>
  );
}
