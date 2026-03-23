import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LyriaProvider } from "../lyria-provider";

const DEFAULT_OPTIONS = {
  style: "epic orchestral",
  lyrics: "",
  bpm: 80,
  durationSec: 30,
  instrumental: true,
  language: "instrumental",
};

describe("LyriaProvider", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends POST to /api/music/generate with correct body", async () => {
    const mockArrayBuffer = new ArrayBuffer(8);
    const mockResponse = {
      ok: true,
      arrayBuffer: () => Promise.resolve(mockArrayBuffer),
    } as Response;

    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const provider = new LyriaProvider();
    await provider.generateTrack(DEFAULT_OPTIONS);

    expect(globalThis.fetch).toHaveBeenCalledWith("/api/music/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "epic orchestral", bpm: 80, durationSec: 30 }),
    });
  });

  it("returns ArrayBuffer on success", async () => {
    const mockArrayBuffer = new ArrayBuffer(16);
    const mockResponse = {
      ok: true,
      arrayBuffer: () => Promise.resolve(mockArrayBuffer),
    } as Response;

    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const provider = new LyriaProvider();
    const result = await provider.generateTrack({ ...DEFAULT_OPTIONS, style: "test", bpm: 60, durationSec: 20 });

    expect(result).toBe(mockArrayBuffer);
  });

  it("throws error on non-ok response", async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal Server Error"),
    } as unknown as Response;

    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const provider = new LyriaProvider();
    await expect(provider.generateTrack({ ...DEFAULT_OPTIONS, style: "test", bpm: 60, durationSec: 20 })).rejects.toThrow(
      "Music generation failed (500): Internal Server Error",
    );
  });

  it("handles text() failure gracefully on error response", async () => {
    const mockResponse = {
      ok: false,
      status: 502,
      text: () => Promise.reject(new Error("stream error")),
    } as unknown as Response;

    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const provider = new LyriaProvider();
    await expect(provider.generateTrack({ ...DEFAULT_OPTIONS, style: "test", bpm: 60, durationSec: 20 })).rejects.toThrow(
      "Music generation failed (502): ",
    );
  });
});
