/**
 * lib/env.ts — Team 1 (Backend)
 *
 * Server-only, Zod-validated environment. Import nothing from here into
 * client components. Fails fast at first import with a readable error
 * instead of a mid-request undefined.
 *
 * Swapping the detection provider is a config change, not a code change:
 *   DETECTION_PROVIDER=yolov8-crack DETECTION_MODEL_PATH=./models/yolo.onnx
 */

import { z } from "zod";
import { DetectionProviderIdSchema } from "./schemas";

const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),

  /** Which detection provider `detectDefects()` routes to. */
  DETECTION_PROVIDER: DetectionProviderIdSchema.default("claude-vision"),

  /** Claude model used by the claude-vision provider AND the report step. */
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-4-6"),

  /**
   * Filesystem path or URL of a trained checkpoint. Required only when
   * DETECTION_PROVIDER is a trained-model provider; validated below.
   */
  DETECTION_MODEL_PATH: z.string().min(1).optional(),
}).superRefine((env, ctx) => {
  const needsCheckpoint =
    env.DETECTION_PROVIDER === "yolov8-crack" ||
    env.DETECTION_PROVIDER === "sdnet-custom";
  if (needsCheckpoint && !env.DETECTION_MODEL_PATH) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["DETECTION_MODEL_PATH"],
      message: `DETECTION_MODEL_PATH is required when DETECTION_PROVIDER=${env.DETECTION_PROVIDER}`,
    });
  }
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
export type Env = typeof env;