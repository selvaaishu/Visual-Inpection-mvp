/**
 * lib/schemas.ts — Team 1 (Backend)
 *
 * The shared data contract for defect detection. Everything downstream of
 * `detectDefects()` (Server Action, UI, report generation) depends ONLY on
 * `DefectAnalysis`. Providers (Claude vision today, YOLOv8 / custom SDNET
 * model later) are responsible for producing this shape; nothing else changes
 * when the provider changes.
 *
 * Design notes:
 *
 * 1. `confidence` is nullable and paired with `confidenceBasis`. This is the
 *    interface-level answer to the known limitation flagged by Team 4: the
 *    Claude-vision provider CANNOT honestly emit a confidence score, so it
 *    returns `confidence: null, confidenceBasis: "none"`. A trained model
 *    returns a real score with basis "model_score" (raw logit/softmax) or
 *    "calibrated" (post-calibration). The UI can then render "confidence
 *    unavailable" vs. "87%" without knowing which provider ran.
 *
 * 2. `RawClaudeDetection` (below) deliberately EXCLUDES confidence. We never
 *    ask the LLM to invent a number for it. Provenance is attached by the
 *    service layer, not by the model output.
 *
 * 3. `boundingBoxes` is optional. Claude vision gives a textual `location`
 *    only; YOLO-style models will also populate normalized boxes. Frontend
 *    treats boxes as progressive enhancement.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Core enums
// ---------------------------------------------------------------------------

export const DefectTypeSchema = z.enum([
  "crack",
  "spalling",
  "honeycombing",
  "corrosion",
  "surface_void",
  "discoloration",
  "other",
]);
export type DefectType = z.infer<typeof DefectTypeSchema>;

export const SeveritySchema = z.enum(["low", "medium", "high"]);
export type Severity = z.infer<typeof SeveritySchema>;

export const RecommendedActionSchema = z.enum(["pass", "monitor", "escalate"]);
export type RecommendedAction = z.infer<typeof RecommendedActionSchema>;

/**
 * How the confidence number (if any) was produced.
 * - "none": provider cannot produce an honest score (Claude vision).
 * - "model_score": raw score from a trained model (uncalibrated).
 * - "calibrated": score passed through a calibration step validated on our
 *   own image distribution. Only use once that evaluation has actually run.
 */
export const ConfidenceBasisSchema = z.enum(["none", "model_score", "calibrated"]);
export type ConfidenceBasis = z.infer<typeof ConfidenceBasisSchema>;

export const DetectionProviderIdSchema = z.enum([
  "claude-vision",
  "yolov8-crack",
  "sdnet-custom",
]);
export type DetectionProviderId = z.infer<typeof DetectionProviderIdSchema>;

// ---------------------------------------------------------------------------
// Defect + analysis shapes
// ---------------------------------------------------------------------------

/** Normalized [0,1] coordinates so boxes are resolution-independent. */
export const BoundingBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});
export type BoundingBox = z.infer<typeof BoundingBoxSchema>;

export const DefectSchema = z.object({
  type: DefectTypeSchema,
  severity: SeveritySchema,
  /** Approximate % of the visible surface affected. */
  affectedAreaPercent: z.number().min(0).max(100),
  /** Human-readable location, e.g. "lower-left quadrant, running diagonally". */
  location: z.string().min(1).max(300),
  /** Populated by trained models only; absent for Claude vision. */
  boundingBoxes: z.array(BoundingBoxSchema).optional(),
});
export type Defect = z.infer<typeof DefectSchema>;

/** Attached by the service layer — never emitted by a model. */
export const DetectionProvenanceSchema = z.object({
  provider: DetectionProviderIdSchema,
  /** e.g. "claude-sonnet-4-6" or "yolov8n-crack@sha256:…" */
  modelId: z.string().min(1),
  analyzedAt: z.string().datetime(),
  /** Null whenever confidenceBasis is "none". */
  confidence: z.number().min(0).max(1).nullable(),
  confidenceBasis: ConfidenceBasisSchema,
}).superRefine((p, ctx) => {
  if (p.confidenceBasis === "none" && p.confidence !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'confidence must be null when confidenceBasis is "none"',
      path: ["confidence"],
    });
  }
  if (p.confidenceBasis !== "none" && p.confidence === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `confidence is required when confidenceBasis is "${p.confidenceBasis}"`,
      path: ["confidence"],
    });
  }
});
export type DetectionProvenance = z.infer<typeof DetectionProvenanceSchema>;

/** The single output type of `detectDefects()`. */
export const DefectAnalysisSchema = z.object({
  /** Empty array means "no defects detected" — that is a valid result. */
  defects: z.array(DefectSchema).max(10),
  overallRecommendation: RecommendedActionSchema,
  /** Short factual observations (NOT the report paragraph — that's step 4). */
  observations: z.string().min(1).max(1000),
  provenance: DetectionProvenanceSchema,
});
export type DefectAnalysis = z.infer<typeof DefectAnalysisSchema>;

// ---------------------------------------------------------------------------
// Provider input
// ---------------------------------------------------------------------------

export const SupportedImageMediaTypeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
export type SupportedImageMediaType = z.infer<typeof SupportedImageMediaTypeSchema>;

/**
 * What the Server Action hands to `detectDefects()` after its own server-side
 * validation. Raw bytes, not a File — keeps the detection layer independent
 * of the web runtime (a local ONNX/torch model will want bytes anyway).
 */
export interface DetectionImage {
  bytes: Uint8Array;
  mediaType: SupportedImageMediaType;
}

// ---------------------------------------------------------------------------
// Claude-vision provider: raw model output (internal to the provider)
// ---------------------------------------------------------------------------

/**
 * Exactly what we instruct Claude to emit as JSON. Note: no confidence field
 * and no provenance — see design note (2) at the top of this file.
 */
export const RawClaudeDetectionSchema = z.object({
  defects: z.array(
    DefectSchema.omit({ boundingBoxes: true })
  ).max(10),
  overallRecommendation: RecommendedActionSchema,
  observations: z.string().min(1).max(1000),
});
export type RawClaudeDetection = z.infer<typeof RawClaudeDetectionSchema>;