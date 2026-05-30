import { ReadinessStatus } from "@/lib/types";
import { statusLabel } from "@/lib/utils";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface Props {
  status: ReadinessStatus;
  size?: "sm" | "md";
}

const icons = {
  ready: CheckCircle,
  "at-risk": AlertTriangle,
  blocked: XCircle,
};

const classes = {
  ready: "badge-ready",
  "at-risk": "badge-risk",
  blocked: "badge-blocked",
};

export default function StatusBadge({ status, size = "md" }: Props) {
  const Icon = icons[status];
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <span className={classes[status]}>
      <Icon className={iconSize} />
      {statusLabel(status)}
    </span>
  );
}
