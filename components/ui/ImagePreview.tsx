export default function ImagePreview() {
  return (
    <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-slate-800">
        Image Preview
      </h2>

      <div className="flex h-80 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-100">
        <p className="text-slate-500">
          No image uploaded yet
        </p>
      </div>
    </section>
  );
}