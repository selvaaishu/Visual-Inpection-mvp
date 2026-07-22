/**
 * lib/inspection-service.ts — Team 1 (Backend)
 *
 * The detection layer. Public surface is exactly one function:
 *
 *     detectDefects(image: DetectionImage): Promise<DefectAnalysis>
 *
 * Everything else in this file is private plumbing. The Server Action calls
 * `detectDefects` and nothing else; the UI and the report-generation step
 * consume the returned `DefectAnalysis` and never know which provider ran.
 *
 * ── Swapping providers ────────────────────────────────────────────────────
 * Detection backends implement the private `DetectionProvider` interface and
 * register in `PROVIDERS`. Selection is driven by DETECTION_PROVIDER in env,
 * so moving from "Claude guesses" to "YOLOv8 predicts" is:
 *
 *   1. Implement `detect()` in the relevant stub below (yolov8-crack or
 *      sdnet-custom), mapping model output → DefectAnalysis.
 *   2. Set DETECTION_PROVIDER (+ DETECTION_MODEL_PATH) in the environment.
 *
 * No changes to app/actions.ts, lib/schemas.ts consumers, or the UI.
 *
 * ── Confidence honesty (see docs/known-limitations.md, Team 4) ────────────
 * The Claude provider hard-codes `confidence: null, confidenceBasis: "none"`
 * in provenance, and its raw output schema has no confidence field at all —
 * an LLM asked for a score would fabricate one. Trained-model providers are
 * the only ones allowed to emit numeric confidence, and must use
 * "model_score" until calibration against OUR image distribution has been
 * evaluated (only then "calibrated"). This is enforced by
 * DetectionProvenanceSchema, not just convention.
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env";
import {
  DefectAnalysisSchema,
  RawClaudeDetectionSchema,
  type DefectAnalysis,
  type DetectionImage,
  type DetectionProviderId,
} from "./schemas";
// Team 4 owns lib/prompts.ts — imported, never edited here.
// Expected exports (the contract Team 1 codes against):
//   DETECTION_SYSTEM_PROMPT: string
//   DETECTION_USER_PROMPT: string   (must instruct JSON-only output matching
//                                    RawClaudeDetectionSchema)
import { DETECTION_SYSTEM_PROMPT, DETECTION_USER_PROMPT } from "./prompts";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class DetectionError extends Error {
  constructor(
    message: string,
    public readonly provider: DetectionProviderId,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "DetectionError";
  }
}

// ---------------------------------------------------------------------------
// Provider interface (private to this module on purpose)
// ---------------------------------------------------------------------------

interface DetectionProvider {
  readonly id: DetectionProviderId;
  detect(image: DetectionImage): Promise<DefectAnalysis>;
}

// ---------------------------------------------------------------------------
// Provider 1: Claude vision (current default)
// ---------------------------------------------------------------------------

const CLAUDE_MAX_ATTEMPTS = 3;

function uint8ToBase64(bytes: Uint8Array): string {
  // Node runtime (Server Actions run server-side); Buffer is available.
  return Buffer.from(bytes).toString("base64");
}

/** Strip optional Markdown code fences around a JSON payload. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced?.[1]) return fenced[1];
  // Fall back to the outermost object literal if the model added prose.
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) return text.slice(first, last + 1);
  return text.trim();
}

const claudeVisionProvider: DetectionProvider = {
  id: "claude-vision",

  async detect(image) {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const imageBase64 = uint8ToBase64(image.bytes);

    let lastFailure = "";

    for (let attempt = 1; attempt <= CLAUDE_MAX_ATTEMPTS; attempt++) {
      // On retry, feed the validation failure back so the model can correct
      // its output shape rather than repeating the same mistake.
      const retrySuffix =
        attempt === 1
          ? ""
          : `\n\nYour previous response was rejected by schema validation:\n${lastFailure}\nRespond again with ONLY a valid JSON object.`;

      const response = await client.messages.create({
        model: env.ANTHROPIC_MODEL,
        max_tokens: 1500,
        system: DETECTION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: image.mediaType,
                  data: imageBase64,
                },
              },
              { type: "text", text: DETECTION_USER_PROMPT + retrySuffix },
            ],
          },
        ],
      });

      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      let candidate: unknown;
      try {
        candidate = JSON.parse(extractJson(text));
      } catch (err) {
        lastFailure = `Output was not parseable JSON (${String(err)}).`;
        continue;
      }

      const parsed = RawClaudeDetectionSchema.safeParse(candidate);
      if (!parsed.success) {
        lastFailure = parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ");
        continue;
      }

      // Provenance is attached HERE, by the service layer — the model output
      // contains no confidence field and is never trusted to describe itself.
      return DefectAnalysisSchema.parse({
        ...parsed.data,
        provenance: {
          provider: "claude-vision",
          modelId: env.ANTHROPIC_MODEL,
          analyzedAt: new Date().toISOString(),
          confidence: null,
          confidenceBasis: "none",
        },
      } satisfies DefectAnalysis);
    }

    throw new DetectionError(
      `Claude vision output failed validation after ${CLAUDE_MAX_ATTEMPTS} attempts. Last failure: ${lastFailure}`,
      "claude-vision"
    );
  },
};

// ---------------------------------------------------------------------------
// Provider 2: pretrained YOLOv8 crack model (stub — the planned swap target)
// ---------------------------------------------------------------------------

const yolov8CrackProvider: DetectionProvider = {
  id: "yolov8-crack",

  async detect(_image) {
    // Implementation plan (everything below stays inside this function):
    //
    //   1. Load the checkpoint once (module-level lazy singleton) from
    //      env.DETECTION_MODEL_PATH — e.g. ONNX export run via
    //      `onnxruntime-node`, so no Python sidecar is needed.
    //   2. Decode + letterbox `_image.bytes` to the model's input size
    //      (e.g. sharp → 640×640 RGB tensor).
    //   3. Run inference; NMS the raw detections.
    //   4. Map to DefectAnalysis:
    //        - each detection → Defect { type: "crack", boundingBoxes: [...] }
    //          with normalized [0,1] coords per BoundingBoxSchema
    //        - severity + affectedAreaPercent derived from box area / count
    //          (thresholds to be agreed with Team 5 once eval data exists)
    //        - location: generated text like "upper-right quadrant" from box
    //          centroids, so the UI contract is unchanged
    //        - overallRecommendation from severity policy
    //        - provenance.confidence = min or mean detection score,
    //          confidenceBasis: "model_score" — NOT "calibrated" until the
    //          model has been evaluated against our actual image
    //          distribution (its published metrics don't count).
    //   5. Return DefectAnalysisSchema.parse(result).
    //
    // NOTE: this model is crack-only. If DETECTION_PROVIDER selects it, the
    // product implicitly narrows to crack detection; that trade-off belongs
    // to the model decision, not to this interface.
    throw new DetectionError(
      "yolov8-crack provider is not implemented yet. Set DETECTION_PROVIDER=claude-vision.",
      "yolov8-crack"
    );
  },
};

// ---------------------------------------------------------------------------
// Provider 3: custom SDNET2018 model (stub)
// ---------------------------------------------------------------------------

const sdnetCustomProvider: DetectionProvider = {
  id: "sdnet-custom",

  async detect(_image) {
    // SDNET2018 trains a crack / no-crack CLASSIFIER (patch-level), not a
    // detector, so the mapping differs from YOLO:
    //   - tile the image, classify patches, aggregate positive patches into
    //     coarse regions → boundingBoxes (patch-grid resolution)
    //   - affectedAreaPercent = positive patches / total patches
    //   - confidenceBasis: "model_score" until calibration is evaluated
    //   - no-crack across all patches → defects: [], recommendation "pass"
    // Same rule as YOLO: everything lives inside this function; the rest of
    // the app is untouched.
    throw new DetectionError(
      "sdnet-custom provider is not implemented yet. Set DETECTION_PROVIDER=claude-vision.",
      "sdnet-custom"
    );
  },
};

// ---------------------------------------------------------------------------
// Registry + public entry point
// ---------------------------------------------------------------------------

const PROVIDERS: Record<DetectionProviderId, DetectionProvider> = {
  "claude-vision": claudeVisionProvider,
  "yolov8-crack": yolov8CrackProvider,
  "sdnet-custom": sdnetCustomProvider,
};

/**
 * The single public detection entry point.
 *
 * Contract:
 *  - Input has already passed the Server Action's server-side validation
 *    (type, size, rate limit). This layer still schema-validates its OUTPUT.
 *  - Always returns a schema-valid DefectAnalysis or throws DetectionError.
 *  - Stateless: no persistence, no caching of user images.
 */
export async function detectDefects(
  image: DetectionImage
): Promise<DefectAnalysis> {
  const provider = PROVIDERS[env.DETECTION_PROVIDER];
  const result = await provider.detect(image);
  // Belt-and-braces: no provider output escapes unvalidated, so a future
  // provider bug surfaces here rather than in the UI or the report prompt.
  return DefectAnalysisSchema.parse(result);
}