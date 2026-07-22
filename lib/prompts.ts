/**
 * ⚠️ PLACEHOLDER — NOT Team 1's file.
 *
 * lib/prompts.ts is owned by Team 4 (Prompts & Compliance). This stub exists
 * only so lib/inspection-service.ts type-checks before Team 4's real file
 * lands. Rename to prompts.ts locally if you need to compile, and DELETE it
 * the moment the real file exists. Do not tune wording here.
 *
 * The import contract Team 1 codes against (please keep these export names):
 *
 *   export const DETECTION_SYSTEM_PROMPT: string
 *   export const DETECTION_USER_PROMPT: string
 *
 * Requirements on DETECTION_USER_PROMPT from the backend's side:
 *  - Must instruct JSON-only output matching RawClaudeDetectionSchema
 *    (lib/schemas.ts): { defects: [{ type, severity, affectedAreaPercent,
 *    location }], overallRecommendation, observations }.
 *  - Must NOT ask the model for a confidence score. The schema has no field
 *    for one and the service layer records confidenceBasis: "none" for this
 *    provider deliberately (see docs/known-limitations.md).
 */

export const DETECTION_SYSTEM_PROMPT = `You analyze photographs of concrete surfaces for visible defects. Respond only with JSON. [PLACEHOLDER — Team 4 owns the real wording]`;

export const DETECTION_USER_PROMPT = `Identify visible defects in this concrete surface photo. Respond with ONLY a JSON object of the shape:
{
  "defects": [
    {
      "type": "crack" | "spalling" | "honeycombing" | "corrosion" | "surface_void" | "discoloration" | "other",
      "severity": "low" | "medium" | "high",
      "affectedAreaPercent": number (0-100),
      "location": "short description of where in the image"
    }
  ],
  "overallRecommendation": "pass" | "monitor" | "escalate",
  "observations": "2-3 short factual sentences about what is visible"
}
If no defects are visible, return an empty defects array with "pass".
Do not include any field not listed above. Do not include a confidence value.
[PLACEHOLDER — Team 4 owns the real wording]`;