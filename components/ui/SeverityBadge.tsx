interface SeverityBadgeProps {
  severity: "Low" | "Medium" | "High" | "Critical";
}

export default function SeverityBadge({
  severity,
}: SeverityBadgeProps) {
  const colors = {
    Low: "bg-green-100 text-green-700",
    Medium: "bg-yellow-100 text-yellow-700",
    High: "bg-orange-100 text-orange-700",
    Critical: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${colors[severity]}`}
    >
      {severity}
    </span>
  );
}