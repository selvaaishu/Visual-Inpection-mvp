interface DroneEngineeringReportProps {
  report: string | null;
}

export default function DroneEngineeringReport({ report }: DroneEngineeringReportProps) {
  return (
    <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-slate-800">
        Engineering Report
      </h2>

      <p className="leading-7 text-slate-600">
        {report ?? (
          <>
            No inspection has been performed yet. Upload a drone image and
            click <strong>Inspect Structure</strong> to generate an
            AI-assisted engineering report.
          </>
        )}
      </p>
    </section>
  );
}
