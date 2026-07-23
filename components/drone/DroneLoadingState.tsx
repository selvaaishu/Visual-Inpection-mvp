export default function DroneLoadingState() {
  return (
    <section className="flex min-h-[620px] flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-md">
      <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      <h2 className="text-xl font-semibold text-slate-800">
        Analyzing Drone Image
      </h2>
      <p className="mt-2 text-slate-500">
        Running AI-assisted defect detection...
      </p>
    </section>
  );
}
