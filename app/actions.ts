"use server";

/**
 * app/actions.ts — Server Action for the Visual Inspection MVP's upload flow.
 *
 * TEMPORARY: detection/report-generation below reuse the drone module's mock
 * functions (lib/drone/drone-inspection-service.ts, lib/drone/drone-report-service.ts)
 * purely because they already produce realistic, schema-valid DefectAnalysis
 * data with zero cost and no API key required. lib/inspection-service.ts
 * already has a REAL, fully-implemented Claude Vision provider (detectDefects)
 * ready to go — swap the two calls below for that the moment
 * ANTHROPIC_API_KEY is set in Vercel's project environment variables.
 * Nothing else (this file's validation/rate-limiting, or the UI) needs to
 * change when that swap happens.
 */

import { z } from "zod";
import { SupportedImageMediaTypeSchema, DefectAnalysisSchema } from "@/lib/schemas";
import { detectDroneDefects } from "@/lib/drone/drone-inspection-service";
import { generateEngineeringReport } from "@/lib/drone/drone-report-service";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // matches the UI's "Maximum size: 50MB" copy

const ResultSchema = DefectAnalysisSchema.extend({
  engineeringReport: z.string().min(1).max(2000),
});
export type AnalyzeSurfaceResult =
  | { success: true; data: z.infer<typeof ResultSchema> }
  | { success: false; error: string };

// Basic in-memory sliding-window limiter, global (no auth/session to key on).
// Not production-grade: resets on restart, shared across all visitors, and
// doesn't work across multiple server instances. Independent from the
// drone module's own counter so the two routes don't share one quota.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestTimestamps: number[] = [];
function checkRateLimit(): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  while (requestTimestamps.length > 0 && requestTimestamps[0] < cutoff) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) return false;
  requestTimestamps.push(now);
  return true;
}

export async function analyzeSurfaceImage(
  formData: FormData
): Promise<AnalyzeSurfaceResult> {
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

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      success: false,
      error: `File is too large. Maximum size is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`,
    };
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());

    const analysis = await detectDroneDefects({ bytes, mediaType: mediaTypeCheck.data });
    const engineeringReport = await generateEngineeringReport(analysis);

    const data = ResultSchema.parse({ ...analysis, engineeringReport });

    return { success: true, data };
  } catch (err) {
    console.error("analyzeSurfaceImage failed:", err);
    return {
      success: false,
      error: "Analysis failed unexpectedly. Please try again.",
    };
  }
}
