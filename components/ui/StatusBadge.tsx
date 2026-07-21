interface StatusBadgeProps {
  status: "PASS" | "MONITOR" | "ESCALATE";
}

export default function StatusBadge({
  status,
}: StatusBadgeProps) {
  const colors = {
    PASS: "bg-green-100 text-green-700",
    MONITOR: "bg-yellow-100 text-yellow-700",
    ESCALATE: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${colors[status]}`}
    >
      {status}
    </span>
  );
}