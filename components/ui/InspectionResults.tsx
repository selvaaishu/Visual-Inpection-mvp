import SeverityBadge from "./SeverityBadge";
import StatusBadge from "./StatusBadge";
import type { DefectAnalysis } from "@/lib/schemas";

interface InspectionResultsProps {
  result: (DefectAnalysis & { engineeringReport: string }) | null;
}

// SeverityBadge/StatusBadge use a different casing convention than the
// shared DefectAnalysis schema (lowercase "low"/"medium"/"high" and
// "pass"/"monitor"/"escalate") — map rather than change either component.
const SEVERITY_LABEL = { low: "Low", medium: "Medium", high: "High" } as const;
const STATUS_LABEL = { pass: "PASS", monitor: "MONITOR", escalate: "ESCALATE" } as const;

export default function InspectionResults({ result }: InspectionResultsProps) {
  const defect = result?.defects[0] ?? null;
  // Claude-vision-style providers never report confidence honestly (see
  // lib/schemas.ts's DetectionProvenanceSchema) — null stays null, not a
  // fabricated number.
  const confidencePercent =
    result && result.provenance.confidence !== null
      ? Math.round(result.provenance.confidence * 100)
      : null;

  return (
    <section className="min-h-[620px] rounded-2xl bg-white p-8 shadow-md flex flex-col">

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">
          Inspection Results
        </h2>

        {result && (
          <span className="text-sm text-green-600">
            AI Analysis Complete
          </span>
        )}
      </div>

      {!result ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-center text-slate-500">
            Upload a concrete surface image and click <strong>Inspect Surface</strong>{" "}
            to see results here.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-between">

          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Defect Type</span>
            <span className="font-semibold capitalize text-slate-800">
              {defect ? defect.type.replace("_", " ") : "None detected"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Severity</span>
            {defect ? (
              <SeverityBadge severity={SEVERITY_LABEL[defect.severity]} />
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Affected Area</span>
            <span className="font-semibold text-slate-800">
              {defect ? `~${defect.affectedAreaPercent.toFixed(1)}%` : "—"}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="shrink-0 text-slate-500">Location</span>
            <span className="text-right font-semibold text-slate-800">
              {defect ? defect.location : "—"}
            </span>
          </div>

          <div>
            <div className="mb-2 flex justify-between gap-4">
              <span className="text-slate-500">
                Confidence Score
              </span>

              <span className="font-semibold text-slate-800">
                {confidencePercent !== null ? `${confidencePercent}%` : "Not available"}
              </span>
            </div>

            <div className="h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-blue-600"
                style={{ width: `${confidencePercent ?? 0}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">
              Recommendation
            </span>

            <StatusBadge status={STATUS_LABEL[result.overallRecommendation]} />
          </div>

        </div>
      )}

    </section>
  );
}
