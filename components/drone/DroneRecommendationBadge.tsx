import type { RecommendedAction } from "@/lib/schemas";

interface DroneRecommendationBadgeProps {
  recommendation: RecommendedAction;
}

const LABELS: Record<RecommendedAction, string> = {
  pass: "PASS",
  monitor: "MONITOR",
  escalate: "ESCALATE",
};

const COLORS: Record<RecommendedAction, string> = {
  pass: "bg-green-100 text-green-700",
  monitor: "bg-yellow-100 text-yellow-700",
  escalate: "bg-red-100 text-red-700",
};

export default function DroneRecommendationBadge({
  recommendation,
}: DroneRecommendationBadgeProps) {
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${COLORS[recommendation]}`}>
      {LABELS[recommendation]}
    </span>
  );
}
