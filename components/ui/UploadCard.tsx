export default function UploadCard() {
  return (
    <section className="min-h-[620px] rounded-2xl bg-white p-8 shadow-md">

      <h2 className="mb-2 text-2xl font-bold text-slate-800">
        Upload Concrete Surface
      </h2>

      <p className="mb-6 text-slate-500">
        Upload a concrete surface image for AI-assisted structural defect detection.
      </p>

      {/* Upload Area */}
      <div className="flex h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-blue-500 hover:bg-blue-50">

        <div className="mb-4 text-6xl">
          ☁️
        </div>

        <h3 className="text-xl font-semibold text-slate-800">
          Drag & Drop Image
        </h3>

        <p className="mt-2 text-center text-slate-500">
          Support PNG, JPG and JPEG
          <br />
          Maximum size: 50MB
        </p>

        <button className="mt-6 rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-100">
          Browse Files
        </button>

      </div>

      <button className="mt-8 w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700">
        Inspect Surface
      </button>

    </section>
  );
}