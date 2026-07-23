"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

interface DroneUploadCardProps {
  onFileSelected: (file: File) => void;
  onSubmit: () => void;
  hasFile: boolean;
  isPending: boolean;
}

export default function DroneUploadCard({
  onFileSelected,
  onSubmit,
  hasFile,
  isPending,
}: DroneUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <section className="min-h-[620px] rounded-2xl bg-white p-8 shadow-md">
      <h2 className="mb-2 text-2xl font-bold text-slate-800">
        Upload Drone Image
      </h2>

      <p className="mb-6 text-slate-500">
        Upload a drone-captured image of a building or concrete structure for
        AI-assisted defect detection.
      </p>

      <div
        onDragOver={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed transition ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-blue-500 hover:bg-blue-50"
        }`}
      >
        <div className="mb-4 text-6xl">🚁</div>

        <h3 className="text-xl font-semibold text-slate-800">
          Drag & Drop Drone Image
        </h3>

        <p className="mt-2 text-center text-slate-500">
          Supports PNG, JPG and WEBP
          <br />
          Maximum size: 15MB
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-6 rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Browse Files
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
        />
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!hasFile || isPending}
        className="mt-8 w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isPending ? "Analyzing..." : "Inspect Structure"}
      </button>
    </section>
  );
}
