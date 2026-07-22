import type { Severity } from "@/lib/schemas";

interface DroneSeverityBadgeProps {
  severity: Severity;
}

const LABELS: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const COLORS: Record<Severity, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
};

export default function DroneSeverityBadge({ severity }: DroneSeverityBadgeProps) {
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${COLORS[severity]}`}>
      {LABELS[severity]}
    </span>
  );
}
