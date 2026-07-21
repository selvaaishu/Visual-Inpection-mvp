import SeverityBadge from "./SeverityBadge";
import StatusBadge from "./StatusBadge";

export default function InspectionResults() {
  return (
    <section className="min-h-[620px] rounded-2xl bg-white p-8 shadow-md flex flex-col">

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">
          Inspection Results
        </h2>

        <span className="text-sm text-green-600">
          AI Analysis Complete
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between">

        <div className="flex justify-between">
          <span className="text-slate-500">Defect Type</span>
          <span className="font-semibold">Hairline Crack</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Severity</span>
          <SeverityBadge severity="High" />
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Affected Area</span>
          <span className="font-semibold">12%</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Location</span>
          <span className="font-semibold">Column B4</span>
        </div>

        <div>
          <div className="mb-2 flex justify-between">
            <span className="text-slate-500">
              Confidence Score
            </span>

            <span className="font-semibold">
              94%
            </span>
          </div>

          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-2 w-[94%] rounded-full bg-blue-600"></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">
            Recommendation
          </span>

          <StatusBadge status="MONITOR" />
        </div>

      </div>

    </section>
  );
}