/**
 * lib/drone/schemas.ts — Drone Surveillance
 *
 * Reuses the shared `DefectAnalysisSchema` from lib/schemas.ts (Team 1)
 * unchanged — its DefectType enum (crack, spalling, corrosion, etc.) already
 * covers building-facade defects seen in drone imagery, and its provenance
 * block already enforces the "no fabricated confidence from an LLM" rule.
 * The only addition here is the generated engineering report paragraph,
 * which is a separate pipeline step (see lib/drone/drone-report-service.ts)
 * and not part of the detection contract itself.
 */

import { z } from "zod";
import { DefectAnalysisSchema } from "../schemas";

/** The exact shape the Server Action returns to the client on success. */
export const DroneAnalysisResultSchema = DefectAnalysisSchema.extend({
  engineeringReport: z.string().min(1).max(2000),
});
export type DroneAnalysisResult = z.infer<typeof DroneAnalysisResultSchema>;

/**
 * Upload constraints enforced by the Server Action before any detection call
 * runs. Accepted MIME types reuse SupportedImageMediaTypeSchema from
 * lib/schemas.ts (jpeg/png/webp) since that's what the detection pipeline
 * (real or mocked) can actually consume.
 */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB — drone photos run large
