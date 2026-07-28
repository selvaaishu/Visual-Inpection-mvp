import { describe, it, expect } from "vitest";
import {
  DefectTypeSchema,
  SeveritySchema,
  RecommendedActionSchema,
  ConfidenceBasisSchema,
  DetectionProviderIdSchema,
  BoundingBoxSchema,
  DefectSchema,
  DetectionProvenanceSchema,
  DefectAnalysisSchema,
  RawClaudeDetectionSchema,
  SupportedImageMediaTypeSchema,
} from "./schemas";

describe("enum schemas", () => {
  it("DefectTypeSchema accepts every documented defect type", () => {
    for (const value of [
      "crack",
      "spalling",
      "honeycombing",
      "corrosion",
      "surface_void",
      "discoloration",
      "other",
    ]) {
      expect(DefectTypeSchema.safeParse(value).success).toBe(true);
    }
    expect(DefectTypeSchema.safeParse("rust").success).toBe(false);
  });

  it("SeveritySchema accepts lowercase values and rejects wrong casing", () => {
    for (const value of ["low", "medium", "high"]) {
      expect(SeveritySchema.safeParse(value).success).toBe(true);
    }
    expect(SeveritySchema.safeParse("Low").success).toBe(false);
    expect(SeveritySchema.safeParse("critical").success).toBe(false);
  });

  it("RecommendedActionSchema accepts lowercase values and rejects wrong casing", () => {
    for (const value of ["pass", "monitor", "escalate"]) {
      expect(RecommendedActionSchema.safeParse(value).success).toBe(true);
    }
    expect(RecommendedActionSchema.safeParse("PASS").success).toBe(false);
  });

  it("ConfidenceBasisSchema accepts the three defined bases", () => {
    for (const value of ["none", "model_score", "calibrated"]) {
      expect(ConfidenceBasisSchema.safeParse(value).success).toBe(true);
    }
    expect(ConfidenceBasisSchema.safeParse("guessed").success).toBe(false);
  });

  it("DetectionProviderIdSchema accepts the three known providers", () => {
    for (const value of ["claude-vision", "yolov8-crack", "sdnet-custom"]) {
      expect(DetectionProviderIdSchema.safeParse(value).success).toBe(true);
    }
    expect(DetectionProviderIdSchema.safeParse("gpt-vision").success).toBe(false);
  });
});

describe("BoundingBoxSchema", () => {
  const valid = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };

  it("accepts a valid normalized box", () => {
    expect(BoundingBoxSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts boundary values 0 and 1", () => {
    expect(
      BoundingBoxSchema.safeParse({ x: 0, y: 0, width: 1, height: 1 }).success
    ).toBe(true);
  });

  it("rejects negative coordinates", () => {
    expect(BoundingBoxSchema.safeParse({ ...valid, x: -0.01 }).success).toBe(
      false
    );
  });

  it("rejects coordinates greater than 1", () => {
    expect(BoundingBoxSchema.safeParse({ ...valid, width: 1.01 }).success).toBe(
      false
    );
  });
});

describe("DefectSchema", () => {
  const valid = {
    type: "crack" as const,
    severity: "high" as const,
    affectedAreaPercent: 12,
    location: "lower-left quadrant, running diagonally",
  };

  it("accepts a valid defect without boundingBoxes", () => {
    expect(DefectSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a valid defect with boundingBoxes", () => {
    const withBoxes = {
      ...valid,
      boundingBoxes: [{ x: 0, y: 0, width: 0.5, height: 0.5 }],
    };
    expect(DefectSchema.safeParse(withBoxes).success).toBe(true);
  });

  it("accepts affectedAreaPercent boundary values 0 and 100", () => {
    expect(
      DefectSchema.safeParse({ ...valid, affectedAreaPercent: 0 }).success
    ).toBe(true);
    expect(
      DefectSchema.safeParse({ ...valid, affectedAreaPercent: 100 }).success
    ).toBe(true);
  });

  it("rejects affectedAreaPercent outside 0-100", () => {
    expect(
      DefectSchema.safeParse({ ...valid, affectedAreaPercent: -1 }).success
    ).toBe(false);
    expect(
      DefectSchema.safeParse({ ...valid, affectedAreaPercent: 101 }).success
    ).toBe(false);
  });

  it("rejects an empty location", () => {
    expect(DefectSchema.safeParse({ ...valid, location: "" }).success).toBe(
      false
    );
  });

  it("rejects a location longer than 300 characters", () => {
    expect(
      DefectSchema.safeParse({ ...valid, location: "x".repeat(301) }).success
    ).toBe(false);
  });

  it("accepts a location at the 300 character boundary", () => {
    expect(
      DefectSchema.safeParse({ ...valid, location: "x".repeat(300) }).success
    ).toBe(true);
  });
});

describe("DetectionProvenanceSchema", () => {
  const base = {
    provider: "claude-vision" as const,
    modelId: "claude-sonnet-4-6",
    analyzedAt: new Date().toISOString(),
  };

  it("accepts confidenceBasis 'none' paired with null confidence", () => {
    const result = DetectionProvenanceSchema.safeParse({
      ...base,
      confidence: null,
      confidenceBasis: "none",
    });
    expect(result.success).toBe(true);
  });

  it("rejects confidenceBasis 'none' paired with a non-null confidence", () => {
    const result = DetectionProvenanceSchema.safeParse({
      ...base,
      confidence: 0.5,
      confidenceBasis: "none",
    });
    expect(result.success).toBe(false);
  });

  it("rejects confidenceBasis 'model_score' paired with null confidence", () => {
    const result = DetectionProvenanceSchema.safeParse({
      ...base,
      confidence: null,
      confidenceBasis: "model_score",
    });
    expect(result.success).toBe(false);
  });

  it("accepts confidenceBasis 'model_score' paired with a numeric confidence", () => {
    const result = DetectionProvenanceSchema.safeParse({
      ...base,
      confidence: 0.82,
      confidenceBasis: "model_score",
    });
    expect(result.success).toBe(true);
  });

  it("rejects confidenceBasis 'calibrated' paired with null confidence", () => {
    const result = DetectionProvenanceSchema.safeParse({
      ...base,
      confidence: null,
      confidenceBasis: "calibrated",
    });
    expect(result.success).toBe(false);
  });

  it("accepts confidenceBasis 'calibrated' paired with a numeric confidence", () => {
    const result = DetectionProvenanceSchema.safeParse({
      ...base,
      confidence: 0.95,
      confidenceBasis: "calibrated",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-ISO-datetime analyzedAt", () => {
    const result = DetectionProvenanceSchema.safeParse({
      ...base,
      analyzedAt: "2024-01-01",
      confidence: null,
      confidenceBasis: "none",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty modelId", () => {
    const result = DetectionProvenanceSchema.safeParse({
      ...base,
      modelId: "",
      confidence: null,
      confidenceBasis: "none",
    });
    expect(result.success).toBe(false);
  });
});

describe("DefectAnalysisSchema", () => {
  const provenance = {
    provider: "claude-vision" as const,
    modelId: "claude-sonnet-4-6",
    analyzedAt: new Date().toISOString(),
    confidence: null,
    confidenceBasis: "none" as const,
  };

  const defect = {
    type: "crack" as const,
    severity: "low" as const,
    affectedAreaPercent: 5,
    location: "top edge",
  };

  it("accepts an empty defects array as a valid 'no defects' result", () => {
    const result = DefectAnalysisSchema.safeParse({
      defects: [],
      overallRecommendation: "pass",
      observations: "No visible defects.",
      provenance,
    });
    expect(result.success).toBe(true);
  });

  it("accepts exactly 10 defects", () => {
    const result = DefectAnalysisSchema.safeParse({
      defects: Array.from({ length: 10 }, () => defect),
      overallRecommendation: "monitor",
      observations: "Multiple minor cracks observed.",
      provenance,
    });
    expect(result.success).toBe(true);
  });

  it("rejects 11 defects", () => {
    const result = DefectAnalysisSchema.safeParse({
      defects: Array.from({ length: 11 }, () => defect),
      overallRecommendation: "monitor",
      observations: "Too many defects.",
      provenance,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty observations string", () => {
    const result = DefectAnalysisSchema.safeParse({
      defects: [],
      overallRecommendation: "pass",
      observations: "",
      provenance,
    });
    expect(result.success).toBe(false);
  });

  it("rejects observations longer than 1000 characters", () => {
    const result = DefectAnalysisSchema.safeParse({
      defects: [],
      overallRecommendation: "pass",
      observations: "x".repeat(1001),
      provenance,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid nested provenance", () => {
    const result = DefectAnalysisSchema.safeParse({
      defects: [],
      overallRecommendation: "pass",
      observations: "No visible defects.",
      provenance: { ...provenance, confidence: 0.5, confidenceBasis: "none" },
    });
    expect(result.success).toBe(false);
  });
});

describe("RawClaudeDetectionSchema", () => {
  it("accepts a valid raw detection without boundingBoxes", () => {
    const result = RawClaudeDetectionSchema.safeParse({
      defects: [
        {
          type: "crack",
          severity: "high",
          affectedAreaPercent: 12,
          location: "Column B4",
        },
      ],
      overallRecommendation: "monitor",
      observations: "Hairline crack observed.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a defects array of exactly 10 entries and rejects 11", () => {
    const oneDefect = {
      type: "crack" as const,
      severity: "low" as const,
      affectedAreaPercent: 1,
      location: "edge",
    };
    expect(
      RawClaudeDetectionSchema.safeParse({
        defects: Array.from({ length: 10 }, () => oneDefect),
        overallRecommendation: "pass",
        observations: "ok",
      }).success
    ).toBe(true);
    expect(
      RawClaudeDetectionSchema.safeParse({
        defects: Array.from({ length: 11 }, () => oneDefect),
        overallRecommendation: "pass",
        observations: "ok",
      }).success
    ).toBe(false);
  });
});

describe("SupportedImageMediaTypeSchema", () => {
  it("accepts the three supported MIME types", () => {
    for (const value of ["image/jpeg", "image/png", "image/webp"]) {
      expect(SupportedImageMediaTypeSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects an unsupported MIME type", () => {
    expect(SupportedImageMediaTypeSchema.safeParse("image/gif").success).toBe(
      false
    );
  });
});
