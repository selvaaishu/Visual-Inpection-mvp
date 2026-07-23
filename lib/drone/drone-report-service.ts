/**
 * lib/drone/drone-report-service.ts
 *
 * Generates the human-readable engineering report paragraph from an already
 * schema-valid `DefectAnalysis`. This is a separate pipeline step from
 * detection on purpose (see the "observations" field note in
 * lib/schemas.ts) — `DefectAnalysis.observations` is short and factual;
 * `engineeringReport` is the longer generated narrative the UI renders in
 * its own section.
 *
 * This is currently a MOCK: it builds a realistic 3–5 sentence paragraph
 * from the analysis fields after a simulated delay. See
 * app/drone-surveillance/CLAUDE.md for the full contract.
 *
 * ── Swap-in point for the real call ───────────────────────────────────────
 * Replace the body of `generateEngineeringReport` below with a real Claude
 * call: pass the validated `DefectAnalysis` as structured context (no image
 * re-upload needed) and prompt for a 3–5 sentence engineering-report
 * paragraph. Nothing outside this function needs to change.
 */

import type { DefectAnalysis } from "../schemas";

const MOCK_REPORT_DELAY_MS = 800;

function describeDefects(analysis: DefectAnalysis): string {
  if (analysis.defects.length === 0) {
    return "No surface defects requiring immediate attention were identified during this inspection.";
  }

  const parts = analysis.defects.map(
    (d) =>
      `${d.severity}-severity ${d.type.replace("_", " ")} affecting approximately ${d.affectedAreaPercent.toFixed(1)}% of the surveyed surface at ${d.location}`
  );
  return `The inspection identified ${parts.join("; and ")}.`;
}

function describeRecommendation(analysis: DefectAnalysis): string {
  switch (analysis.overallRecommendation) {
    case "pass":
      return "Based on the observed condition, no further action is recommended at this time.";
    case "monitor":
      return "It is recommended that this area be logged for periodic monitoring to track any progression.";
    case "escalate":
      return "Given the severity observed, escalation to a structural engineer for on-site evaluation is recommended.";
  }
}

/**
 * The single public report-generation entry point for the drone flow.
 *
 * Contract: input is a schema-valid DefectAnalysis (already validated by the
 * detection step); output is a non-empty paragraph. Stateless — no
 * persistence, no caching of report text.
 */
export async function generateEngineeringReport(
  analysis: DefectAnalysis
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_REPORT_DELAY_MS));

  return [
    describeDefects(analysis),
    analysis.observations,
    describeRecommendation(analysis),
  ].join(" ");
}
