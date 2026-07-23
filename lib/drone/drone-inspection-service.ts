/**
 * lib/drone/drone-inspection-service.ts
 *
 * Mirrors the single-exported-function discipline of
 * lib/inspection-service.ts: the Server Action calls `detectDroneDefects`
 * and nothing else, and everything else in this file is private plumbing.
 *
 * This is currently a MOCK. It returns a schema-valid, realistic
 * DefectAnalysis after a simulated delay so the loading UI can be tested
 * end-to-end. See app/drone-surveillance/CLAUDE.md for the full contract.
 *
 * ── Swap-in point for the real call ───────────────────────────────────────
 * Replace the body of `detectDroneDefects` below with a real call, following
 * the pattern already implemented for `claudeVisionProvider` in
 * lib/inspection-service.ts (base64-encode `image.bytes`, send as a Claude
 * vision message using DETECTION_SYSTEM_PROMPT / DETECTION_USER_PROMPT,
 * parse + validate the JSON response, then attach `provenance` yourself —
 * never trust a model to report its own confidence). Nothing outside this
 * function needs to change: the Server Action, the schema, and the UI all
 * consume `DefectAnalysis` and don't know a mock ever existed here.
 */

import {
  DefectAnalysisSchema,
  type DefectAnalysis,
  type DetectionImage,
} from "../schemas";

const MOCK_DETECTION_DELAY_MS = 1200;

const MOCK_SCENARIOS: Omit<DefectAnalysis, "provenance">[] = [
  {
    defects: [
      {
        type: "crack",
        severity: "medium",
        affectedAreaPercent: 4.5,
        location: "North facade, upper floor, running diagonally near a window corner",
      },
    ],
    overallRecommendation: "monitor",
    observations:
      "A hairline diagonal crack is visible near the upper-floor window corner on the north facade. No visible spalling or exposed rebar nearby.",
  },
  {
    defects: [
      {
        type: "spalling",
        severity: "high",
        affectedAreaPercent: 9.2,
        location: "East facade, mid-level, below the parapet line",
      },
      {
        type: "corrosion",
        severity: "medium",
        affectedAreaPercent: 2.1,
        location: "East facade, staining directly beneath the spalled area",
      },
    ],
    overallRecommendation: "escalate",
    observations:
      "Concrete spalling with exposed aggregate is visible below the parapet on the east facade, with corrosion staining beneath it consistent with water ingress.",
  },
  {
    defects: [],
    overallRecommendation: "pass",
    observations:
      "No visible surface defects were identified on the imaged facade. Surface texture and coloring appear consistent throughout.",
  },
];

function pickMockScenario(): Omit<DefectAnalysis, "provenance"> {
  const index = Math.floor(Math.random() * MOCK_SCENARIOS.length);
  return MOCK_SCENARIOS[index];
}

/**
 * The single public detection entry point for the drone flow.
 *
 * Contract: input has already passed the Server Action's own validation
 * (type, size, rate limit); this layer still schema-validates its OUTPUT.
 * Always returns a schema-valid DefectAnalysis or throws.
 */
export async function detectDroneDefects(
  _image: DetectionImage
): Promise<DefectAnalysis> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DETECTION_DELAY_MS));

  const scenario = pickMockScenario();

  return DefectAnalysisSchema.parse({
    ...scenario,
    provenance: {
      provider: "claude-vision",
      modelId: "mock-placeholder",
      analyzedAt: new Date().toISOString(),
      confidence: null,
      confidenceBasis: "none",
    },
  } satisfies DefectAnalysis);
}
