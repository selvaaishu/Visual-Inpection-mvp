# Drone Surveillance — placeholder API contract

This module is fully wired end-to-end, but the actual AI analysis is
**mocked**. This file is the map for whoever wires up the real calls.

## The two swap-in points

1. **`lib/drone/drone-inspection-service.ts` → `detectDroneDefects(image)`**
   Currently returns a random pick from a small set of realistic mock
   `DefectAnalysis` objects after a ~1.2s delay. Replace the function body
   with a real call — follow the pattern already implemented in
   `lib/inspection-service.ts`'s `claudeVisionProvider` (base64-encode
   `image.bytes`, send as a Claude vision message, parse + validate the JSON
   response against `RawClaudeDetectionSchema`, then attach `provenance`
   yourself with `confidence: null` / `confidenceBasis: "none"` — never let
   the model report its own confidence). Or wire a trained detection model
   the same way `yolov8-crack`/`sdnet-custom` are stubbed there.
   **Nothing outside this function needs to change.**

2. **`lib/drone/drone-report-service.ts` → `generateEngineeringReport(analysis)`**
   Currently builds a templated paragraph from the `DefectAnalysis` fields
   after a ~0.8s delay. Replace the body with a real Claude call — pass the
   already-validated `DefectAnalysis` as structured context (no need to
   re-send the image) and prompt for a 3–5 sentence engineering report.
   **Nothing outside this function needs to change.**

Both functions are called once each, in sequence, from
`app/drone-surveillance/actions.ts`'s `analyzeDroneImage` Server Action. That
file owns validation/orchestration only and should not need to change when
either swap-in lands.

## Response contract

`app/drone-surveillance/actions.ts` returns:

```ts
type AnalyzeDroneImageResult =
  | { success: true; data: DroneAnalysisResult }
  | { success: false; error: string };
```

`DroneAnalysisResult` (`lib/drone/schemas.ts`) is the shared
`DefectAnalysisSchema` from `lib/schemas.ts` (Team 1's contract — `defects[]`,
`overallRecommendation`, `observations`, `provenance`) extended with one
field:

```ts
engineeringReport: string; // the 3–5 sentence paragraph from step 2 above
```

Do not fork this schema for drone-specific defect types — the shared
`DefectType` enum already covers facade/structure defects seen from drone
imagery. If a genuinely new defect type is needed, add it to
`DefectTypeSchema` in `lib/schemas.ts` so both modules stay on one contract.

## Rate limiting

`lib/drone/rate-limit.ts` is a global, in-memory, sliding-window counter (5
requests / 60s across all visitors). It is explicitly **not**
production-grade: resets on restart, not scoped per user/IP, and doesn't work
across multiple server instances. Swap for a shared store (e.g. Redis) before
any real deployment.

## Environment

No new environment variables are needed for the mock. Once the real Claude
call lands in `detectDroneDefects`/`generateEngineeringReport`, reuse the
existing `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` from `lib/env.ts` — don't
introduce a parallel env schema for this module.
