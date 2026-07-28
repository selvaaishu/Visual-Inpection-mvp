import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { DetectionImage } from "./schemas";

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

const ORIGINAL_ENV = { ...process.env };

function setEnv(overrides: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

const testImage: DetectionImage = {
  bytes: new Uint8Array([1, 2, 3, 4]),
  mediaType: "image/jpeg",
};

function textResponse(text: string) {
  return { content: [{ type: "text", text }] };
}

const validRawJson = JSON.stringify({
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

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.DETECTION_PROVIDER;
  delete process.env.DETECTION_MODEL_PATH;
  setEnv({ ANTHROPIC_API_KEY: "test-key" });
  vi.resetModules();
  mockCreate.mockReset();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("detectDefects — claude-vision provider", () => {
  it("succeeds on the first attempt with markdown-fenced JSON", async () => {
    mockCreate.mockResolvedValueOnce(
      textResponse("```json\n" + validRawJson + "\n```")
    );

    const { detectDefects } = await import("./inspection-service");
    const result = await detectDefects(testImage);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(result.provenance).toEqual({
      provider: "claude-vision",
      modelId: "claude-sonnet-4-6",
      analyzedAt: expect.any(String),
      confidence: null,
      confidenceBasis: "none",
    });
    expect(result.defects).toHaveLength(1);

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe("claude-sonnet-4-6");
    expect(callArgs.max_tokens).toBe(1500);
    const imageBlock = callArgs.messages[0].content[0];
    expect(imageBlock.type).toBe("image");
    expect(imageBlock.source.media_type).toBe("image/jpeg");
    expect(imageBlock.source.data).toBe(
      Buffer.from(testImage.bytes).toString("base64")
    );
  });

  it("extracts JSON embedded in prose without markdown fences", async () => {
    mockCreate.mockResolvedValueOnce(
      textResponse(`Here is the result: ${validRawJson} Thanks!`)
    );

    const { detectDefects } = await import("./inspection-service");
    const result = await detectDefects(testImage);

    expect(result.defects).toHaveLength(1);
  });

  it("retries once after a schema-invalid response then succeeds", async () => {
    mockCreate
      .mockResolvedValueOnce(textResponse(JSON.stringify({ defects: [] })))
      .mockResolvedValueOnce(textResponse(validRawJson));

    const { detectDefects } = await import("./inspection-service");
    const result = await detectDefects(testImage);

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(result.defects).toHaveLength(1);
  });

  it("retries through a non-JSON response and a schema-invalid response before succeeding", async () => {
    mockCreate
      .mockResolvedValueOnce(textResponse("not json at all, sorry"))
      .mockResolvedValueOnce(textResponse(JSON.stringify({ defects: [] })))
      .mockResolvedValueOnce(textResponse(validRawJson));

    const { detectDefects } = await import("./inspection-service");
    const result = await detectDefects(testImage);

    expect(mockCreate).toHaveBeenCalledTimes(3);
    expect(result.defects).toHaveLength(1);
  });

  it("throws DetectionError after exhausting all 3 retry attempts", async () => {
    mockCreate.mockResolvedValue(textResponse("still not valid"));

    const { detectDefects, DetectionError } = await import(
      "./inspection-service"
    );

    await expect(detectDefects(testImage)).rejects.toThrow(DetectionError);
    expect(mockCreate).toHaveBeenCalledTimes(3);
  });

  it("the thrown DetectionError carries the claude-vision provider id", async () => {
    mockCreate.mockResolvedValue(textResponse("still not valid"));

    const { detectDefects } = await import("./inspection-service");

    await expect(detectDefects(testImage)).rejects.toMatchObject({
      provider: "claude-vision",
    });
  });
});

describe("detectDefects — unimplemented provider stubs", () => {
  it("throws a not-implemented DetectionError for yolov8-crack without calling Anthropic", async () => {
    setEnv({
      DETECTION_PROVIDER: "yolov8-crack",
      DETECTION_MODEL_PATH: "./models/yolo.onnx",
    });

    const { detectDefects } = await import("./inspection-service");

    await expect(detectDefects(testImage)).rejects.toThrow(/not implemented/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("throws a not-implemented DetectionError for sdnet-custom without calling Anthropic", async () => {
    setEnv({
      DETECTION_PROVIDER: "sdnet-custom",
      DETECTION_MODEL_PATH: "./models/sdnet.pt",
    });

    const { detectDefects } = await import("./inspection-service");

    await expect(detectDefects(testImage)).rejects.toThrow(/not implemented/i);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
