import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// lib/env.ts parses process.env eagerly at import time and throws on
// invalid config, so every scenario needs a fresh module registry and a
// fresh process.env snapshot.
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

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.DETECTION_PROVIDER;
  delete process.env.ANTHROPIC_MODEL;
  delete process.env.DETECTION_MODEL_PATH;
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("lib/env", () => {
  it("throws when ANTHROPIC_API_KEY is missing", async () => {
    await expect(import("./env")).rejects.toThrow(
      /Invalid environment configuration/
    );
  });

  it("defaults DETECTION_PROVIDER to claude-vision and ANTHROPIC_MODEL to claude-sonnet-4-6", async () => {
    setEnv({ ANTHROPIC_API_KEY: "test-key" });
    const { env } = await import("./env");
    expect(env.DETECTION_PROVIDER).toBe("claude-vision");
    expect(env.ANTHROPIC_MODEL).toBe("claude-sonnet-4-6");
    expect(env.DETECTION_MODEL_PATH).toBeUndefined();
  });

  it("loads successfully with DETECTION_PROVIDER explicitly set to claude-vision and no model path", async () => {
    setEnv({ ANTHROPIC_API_KEY: "test-key", DETECTION_PROVIDER: "claude-vision" });
    const { env } = await import("./env");
    expect(env.DETECTION_PROVIDER).toBe("claude-vision");
  });

  it("throws when DETECTION_PROVIDER is yolov8-crack and DETECTION_MODEL_PATH is unset", async () => {
    setEnv({ ANTHROPIC_API_KEY: "test-key", DETECTION_PROVIDER: "yolov8-crack" });
    await expect(import("./env")).rejects.toThrow(/DETECTION_MODEL_PATH/);
  });

  it("loads successfully when DETECTION_PROVIDER is yolov8-crack and DETECTION_MODEL_PATH is set", async () => {
    setEnv({
      ANTHROPIC_API_KEY: "test-key",
      DETECTION_PROVIDER: "yolov8-crack",
      DETECTION_MODEL_PATH: "./models/yolo.onnx",
    });
    const { env } = await import("./env");
    expect(env.DETECTION_PROVIDER).toBe("yolov8-crack");
    expect(env.DETECTION_MODEL_PATH).toBe("./models/yolo.onnx");
  });

  it("throws when DETECTION_PROVIDER is sdnet-custom and DETECTION_MODEL_PATH is unset", async () => {
    setEnv({ ANTHROPIC_API_KEY: "test-key", DETECTION_PROVIDER: "sdnet-custom" });
    await expect(import("./env")).rejects.toThrow(/DETECTION_MODEL_PATH/);
  });

  it("loads successfully when DETECTION_PROVIDER is sdnet-custom and DETECTION_MODEL_PATH is set", async () => {
    setEnv({
      ANTHROPIC_API_KEY: "test-key",
      DETECTION_PROVIDER: "sdnet-custom",
      DETECTION_MODEL_PATH: "./models/sdnet.pt",
    });
    const { env } = await import("./env");
    expect(env.DETECTION_PROVIDER).toBe("sdnet-custom");
  });
});
