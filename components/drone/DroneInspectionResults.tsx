import DroneSeverityBadge from "./DroneSeverityBadge";
import DroneRecommendationBadge from "./DroneRecommendationBadge";
import type { DroneAnalysisResult } from "@/lib/drone/schemas";

interface DroneInspectionResultsProps {
  result: DroneAnalysisResult | null;
}

export default function DroneInspectionResults({ result }: DroneInspectionResultsProps) {
  return (
    <section className="flex min-h-[620px] flex-col rounded-2xl bg-white p-8 shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">
          Inspection Results
        </h2>

        {result && (
          <span className="text-sm text-green-600">AI Analysis Complete</span>
        )}
      </div>

      {!result ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-center text-slate-500">
            Upload a drone image and click <strong>Inspect Structure</strong>{" "}
            to see results here.
          </p>
        </div>
      ) : result.defects.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-slate-600">
            No defects detected on the surveyed surface.
          </p>
          <DroneRecommendationBadge recommendation={result.overallRecommendation} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-between gap-6">
          <div className="flex flex-col gap-4 overflow-y-auto">
            {result.defects.map((defect, index) => (
              <div key={index} className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold capitalize text-slate-800">
                    {defect.type.replace("_", " ")}
                  </span>
                  <DroneSeverityBadge severity={defect.severity} />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Affected Area</span>
                  <span className="font-medium text-slate-800">
                    ~{defect.affectedAreaPercent.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Location</span>
                  <span className="text-right font-medium text-slate-800">{defect.location}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-slate-500">Recommendation</span>
            <DroneRecommendationBadge recommendation={result.overallRecommendation} />
          </div>
        </div>
      )}
    </section>
  );
}
