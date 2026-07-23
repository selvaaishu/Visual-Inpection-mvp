/**
 * lib/prompts.ts
 *
 * OWNER: Team 4 — Prompt Engineering & Compliance
 *
 * This file is the single source of truth for:
 *   1. The detection-step system prompt (image -> structured defect JSON)
 *   2. The report-generation system prompt (defect JSON -> paragraph)
 *   3. The forbidden-terms compliance list
 *   4. The retry-count policy for validation failures
 *
 * Consumers (Team 1's lib/inspection-service.ts) import these as a black
 * box. Do not add API-calling logic here. Do not import anything from
 * actions.ts or inspection-service.ts.
 *
 * SOP INJECTION:
 * Both prompt builders accept an optional `sopContext` string. Whenever a
 * relevant SOP document exists for the inspection (structure type,
 * material, jurisdiction, etc.), the caller MUST pass its contents in —
 * the model's output quality and compliance posture depend on the SOP
 * being present, not just the image/JSON. When no SOP applies, pass
 * undefined and the prompt falls back to general concrete-inspection
 * guidance only.
 */

// ---------------------------------------------------------------------------
// 1. Detection system prompt
// ---------------------------------------------------------------------------

/**
 * Detection output contract (mirrors Team 1's Zod schema in lib/schemas.ts —
 * kept here in comment form so prompt and schema stay conceptually in sync;
 * schemas.ts remains the actual validation source of truth).
 *
 * {
 *   defectType: "crack" | "spalling" | "corrosion-staining" | "discoloration" | "none",
 *   severity: "low" | "medium" | "high",
 *   affectedAreaPercent: number,   // 0-100, estimate
 *   location: string,               // free-text description, e.g. "lower-left quadrant"
 *   recommendedAction: "pass" | "monitor" | "escalate",
 *   confidence: "low" | "medium" | "high",
 *   notes: string                   // brief caveats, e.g. lighting, occlusion
 * }
 */

export function buildDetectionSystemPrompt(sopContext?: string): string {
  return `You are a visual inspection assistant analyzing a photograph of a \
concrete surface for defects. You are NOT a licensed structural engineer, \
and your output is a preliminary screening aid, not a certified inspection.

TASK
Examine the provided image and identify visible surface defects such as \
cracks, spalling, corrosion staining, or discoloration. Estimate severity \
and the percentage of the visible surface affected.

${sopContext ? `APPLICABLE SOP (follow this over general guidance where they conflict):\n${sopContext}\n` : "No structure-specific SOP was provided for this inspection. Use general concrete-defect screening conventions only."}

OUTPUT FORMAT
Respond with ONLY a single JSON object, no prose before or after it, matching \
this exact shape:

{
  "defectType": "crack" | "spalling" | "corrosion-staining" | "discoloration" | "none",
  "severity": "low" | "medium" | "high",
  "affectedAreaPercent": <number 0-100>,
  "location": "<short free-text description of where on the surface>",
  "recommendedAction": "pass" | "monitor" | "escalate",
  "confidence": "low" | "medium" | "high",
  "notes": "<brief caveats: lighting, angle, occlusion, image quality, anything limiting your read>"
}

RULES
- If the image is unclear, poorly lit, too distant, or you cannot make a \
reliable determination, set "confidence": "low" and say so plainly in "notes". \
Do not guess a specific defect type to fill the field — use "none" with low \
confidence if you are not reasonably sure something is there.
- Never state or imply certainty about structural safety. You are reporting \
a visual observation, not a safety determination.
- "recommendedAction": "escalate" whenever severity is "high" OR confidence \
is "low" on a surface that shows any possible defect. When in doubt, escalate \
rather than pass.
- Do not include any text outside the JSON object.`;
}

// ---------------------------------------------------------------------------
// 2. Report-generation system prompt
// ---------------------------------------------------------------------------

export function buildReportSystemPrompt(sopContext?: string): string {
  return `You are drafting a short, plain-language inspection note based on \
structured defect-detection data that has already been validated. You do \
not have access to the original image — work only from the JSON data \
provided in the user message.

${sopContext ? `APPLICABLE SOP (reflect its terminology/thresholds if relevant):\n${sopContext}\n` : ""}

TASK
Write a 3-5 sentence paragraph, in the style of a preliminary field note, \
summarizing the finding: what was observed, its approximate severity/extent, \
and the recommended next step.

RULES
- This is a prototype screening tool, not a certified structural assessment. \
Never use language that implies certification, guarantee, or a licensed \
engineer's sign-off.
- If recommendedAction is "escalate," explicitly state that a qualified \
inspector or structural engineer should review the finding in person.
- If confidence is "low," say so in the paragraph rather than writing with \
unwarranted certainty.
- Do not invent details not present in the JSON (exact measurements, causes, \
material specifications) unless they were explicitly provided.
- Avoid every term in the forbidden-terms list below, including close \
paraphrases that carry the same meaning.
- Output plain prose only — no headers, no bullet points, no JSON.`;
}

// ---------------------------------------------------------------------------
// 3. Forbidden terms (compliance)
// ---------------------------------------------------------------------------

/**
 * Terms/phrases that must not appear in generated report paragraphs.
 * These are the highest-liability failure mode for this app: an AI-written
 * report that reads as a professional certification of structural safety.
 *
 * This list is checked post-generation (case-insensitive substring match)
 * by Team 1's code. If a match is found, the retry policy below applies.
 * Keep this list append-only in normal operation — removing a term is a
 * compliance-relevant change and should be reviewed deliberately, not as
 * a drive-by edit.
 */
export const FORBIDDEN_TERMS: string[] = [
  // Certification / authority claims
  "certified",
  "certification",
  "licensed engineer has",
  "engineer-approved",
  "meets code",
  "code-compliant",
  "code compliant",
  "in compliance with",
  "passes inspection",

  // Absolute safety claims
  "structurally sound",
  "safe to occupy",
  "safe for use",
  "no risk",
  "zero risk",
  "guaranteed",
  "guarantee",
  "definitely safe",
  "completely safe",

  // Overstated certainty
  "100% certain",
  "without a doubt",
  "no further action needed",
  "no further action is required",
  "no cause for concern",
  "nothing to worry about",

  // Legal / liability language
  "warranty",
  "liable",
  "not liable",
  "legally compliant",
];

// ---------------------------------------------------------------------------
// 4. Retry policy
// ---------------------------------------------------------------------------

/**
 * Max retries for a generation step (detection or report) when output
 * fails validation — either Zod schema validation (malformed/missing
 * fields) or a forbidden-terms match in the report paragraph.
 *
 * Decision: 2 retries (3 attempts total). Rationale:
 *   - 1 retry alone doesn't reliably recover from transient formatting
 *     slips (e.g. extra prose around the JSON block).
 *   - More than 2 retries adds latency for diminishing returns and risks
 *     masking a systematic prompt problem behind repeated silent retries.
 * If all attempts are exhausted, Team 1's code should surface a
 * user-facing "unable to complete analysis" state rather than returning
 * an unvalidated result.
 */
export const MAX_RETRY_COUNT = 2;
