"use server";

/**
 * app/drone-surveillance/actions.ts
 *
 * The Server Action the UI calls. Validates the upload, applies the
 * in-memory rate limit, then calls the two detection-pipeline steps in
 * lib/drone/*-service.ts (currently mocked — see app/drone-surveillance/CLAUDE.md).
 * This file owns validation and orchestration only; it never itself decides
 * what a defect looks like.
 */

import {
  SupportedImageMediaTypeSchema,
  type SupportedImageMediaType,
} from "@/lib/schemas";
import { MAX_UPLOAD_BYTES, DroneAnalysisResultSchema, type DroneAnalysisResult } from "@/lib/drone/schemas";
import { checkRateLimit } from "@/lib/drone/rate-limit";
import { detectDroneDefects } from "@/lib/drone/drone-inspection-service";
import { generateEngineeringReport } from "@/lib/drone/drone-report-service";

export type AnalyzeDroneImageResult =
  | { success: true; data: DroneAnalysisResult }
  | { success: false; error: string };

export async function analyzeDroneImage(
  formData: FormData
): Promise<AnalyzeDroneImageResult> {
  if (!checkRateLimit()) {
    return {
      success: false,
      error: "Too many analysis requests right now. Please wait a minute and try again.",
    };
  }

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Please select an image to upload." };
  }

  const mediaTypeCheck = SupportedImageMediaTypeSchema.safeParse(file.type);
  if (!mediaTypeCheck.success) {
    return {
      success: false,
      error: "Unsupported file type. Please upload a JPEG, PNG, or WEBP image.",
    };
  }
  const mediaType: SupportedImageMediaType = mediaTypeCheck.data;

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      success: false,
      error: `File is too large. Maximum size is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`,
    };
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());

    const analysis = await detectDroneDefects({ bytes, mediaType });
    const engineeringReport = await generateEngineeringReport(analysis);

    const data = DroneAnalysisResultSchema.parse({
      ...analysis,
      engineeringReport,
    });

    return { success: true, data };
  } catch (err) {
    console.error("analyzeDroneImage failed:", err);
    return {
      success: false,
      error: "Analysis failed unexpectedly. Please try again.",
    };
  }
}
