interface DroneImagePreviewProps {
  previewUrl: string | null;
}

export default function DroneImagePreview({ previewUrl }: DroneImagePreviewProps) {
  return (
    <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-slate-800">
        Image Preview
      </h2>

      {previewUrl ? (
        // Local object-URL preview of an in-memory File — next/image doesn't
        // support blob: URLs, so a plain <img> is the right tool here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Uploaded drone capture"
          className="h-80 w-full rounded-lg bg-slate-100 object-contain"
        />
      ) : (
        <div className="flex h-80 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-100">
          <p className="text-slate-500">No image uploaded yet</p>
        </div>
      )}
    </section>
  );
}
