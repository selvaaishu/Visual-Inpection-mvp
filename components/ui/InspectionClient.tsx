"use client";

import { useState, useTransition } from "react";
import UploadCard from "./UploadCard";
import ImagePreview from "./ImagePreview";
import InspectionResults from "./InspectionResults";
import EngineeringReport from "./EngineeringReport";
import LoadingState from "./LoadingState";
import { analyzeSurfaceImage } from "@/app/actions";
import type { DefectAnalysis } from "@/lib/schemas";

type Result = DefectAnalysis & { engineeringReport: string };

export default function InspectionClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileSelected(selected: File) {
    setFile(selected);
    setResult(null);
    setError(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
  }

  function handleSubmit() {
    if (!file) return;
    setError(null);

    const formData = new FormData();
    formData.set("image", file);

    startTransition(async () => {
      try {
        const response = await analyzeSurfaceImage(formData);
        if (response.success) {
          setResult(response.data);
        } else {
          setResult(null);
          setError(response.error);
        }
      } catch {
        // The Server Action's request never even reached our code — e.g. the
        // file exceeded Next's server-actions body size limit, or the
        // connection dropped.
        setResult(null);
        setError(
          "Upload failed. The file may be too large, or the connection was interrupted — please try a smaller image."
        );
      }
    });
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <UploadCard
            onFileSelected={handleFileSelected}
            onSubmit={handleSubmit}
            hasFile={file !== null}
            isPending={isPending}
          />
          <ImagePreview previewUrl={previewUrl} />
        </div>

        <div>
          {error ? (
            <div className="flex min-h-[620px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-md">
              <p className="font-medium">{error}</p>
            </div>
          ) : isPending ? (
            <LoadingState />
          ) : (
            <InspectionResults result={result} />
          )}
        </div>
      </div>

      <EngineeringReport report={result?.engineeringReport ?? null} />
    </>
  );
}
