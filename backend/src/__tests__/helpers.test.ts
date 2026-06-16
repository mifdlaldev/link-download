import { describe, it, expect } from "vitest";
import {
  sanitizeFilename,
  getSuggestedFilename,
  encodeHeaders,
  decodeHeaders,
  detectProvider,
  hasDirectMediaExtension,
  isLikelyMediaContentType,
  isLikelyAdOrTrackerHost,
  isSameOrigin,
  isLikelyPlayerFrame,
  sanitizeCapturedHeaders,
  buildMediaCandidateScore,
  pickBetterCandidate,
  isLikelyMediaResponse,
} from "../extractor/helpers";

// ─── sanitizeFilename ─────────────────────────────────────────────────────────

describe("sanitizeFilename", () => {
  it.each([
    { input: "normal-video.mp4", expected: "normal-video.mp4" },
    { input: "hello!!!world@@@###$$$.mp4", expected: "hello_world_.mp4" },
    { input: "spaces and dots preserved.mp4", expected: "spaces and dots preserved.mp4" },
    { input: "!!!@@@###", expected: "_" },
    { input: "file_with_underscores.mkv", expected: "file_with_underscores.mkv" },
  ])("returns '$expected' for '$input'", ({ input, expected }) => {
    expect(sanitizeFilename(input)).toBe(expected);
  });
});

// ─── getSuggestedFilename ─────────────────────────────────────────────────────

describe("getSuggestedFilename", () => {
  it.each([
    { url: "https://cdn.example.com/video-123.mp4", title: undefined, expected: "video-123.mp4" },
    { url: "https://cdn.example.com/video%20name.mp4", title: undefined, expected: "video name.mp4" },
    { url: "https://cdn.example.com/stream", title: "My Video", expected: "My Video.mp4" },
    { url: "https://cdn.example.com/stream", title: undefined, expected: "downloaded-video.mp4" },
  ])("returns '$expected' for url=$url title=$title", ({ url, title, expected }) => {
    expect(getSuggestedFilename(url, title)).toBe(expected);
  });
});

// ─── encodeHeaders / decodeHeaders ────────────────────────────────────────────

describe("encodeHeaders / decodeHeaders", () => {
  it("round-trips an object through encode then decode", () => {
    const original = { referer: "https://example.com", "user-agent": "test-agent/1.0" };
    const encoded = encodeHeaders(original);
    const decoded = decodeHeaders(encoded);
    expect(decoded).toEqual(original);
  });

  it("round-trips an empty object", () => {
    const original: Record<string, string> = {};
    const encoded = encodeHeaders(original);
    const decoded = decodeHeaders(encoded);
    expect(decoded).toEqual(original);
  });

  it("throws when decoding invalid base64url", () => {
    expect(() => decodeHeaders("!!!invalid-base64url!!!")).toThrow();
  });
});

// ─── detectProvider ───────────────────────────────────────────────────────────

describe("detectProvider", () => {
  it.each([
    { url: "https://videy.co/abc123", expected: "videy" },
    { url: "https://cdn.videy.co/abc123.mp4", expected: "videy" },
    { url: "https://sub.playvvip.top/video.mp4", expected: "playvvip" },
    { url: "https://fwh.is/abc123", expected: "fwh" },
    { url: "https://unknown.com/something", expected: "unknown.com" },
    { url: "https://videqs.download/file.mp4", expected: "videqs" },
  ])("returns '$expected' for $url", ({ url, expected }) => {
    expect(detectProvider(url)).toBe(expected);
  });
});

// ─── hasDirectMediaExtension ──────────────────────────────────────────────────

describe("hasDirectMediaExtension", () => {
  it.each([
    { url: "https://cdn.example.com/video.mp4", expected: true },
    { url: "https://cdn.example.com/stream.m3u8", expected: true },
    { url: "https://cdn.example.com/page.html", expected: false },
    { url: "invalid-url", expected: false },
    { url: "https://cdn.example.com/video.MP4", expected: true },
    { url: "https://cdn.example.com/video.webm", expected: true },
    { url: "https://cdn.example.com/video.mpd", expected: true },
  ])("returns $expected for $url", ({ url, expected }) => {
    expect(hasDirectMediaExtension(url)).toBe(expected);
  });
});

// ─── isLikelyMediaContentType ─────────────────────────────────────────────────

describe("isLikelyMediaContentType", () => {
  it.each([
    { contentType: "video/mp4", expected: true },
    { contentType: "audio/mpeg", expected: true },
    { contentType: "application/vnd.apple.mpegurl", expected: true },
    { contentType: "application/dash+xml", expected: true },
    { contentType: "text/html", expected: false },
    { contentType: null, expected: false },
    { contentType: undefined, expected: false },
  ])("returns $expected for contentType=$contentType", ({ contentType, expected }) => {
    expect(isLikelyMediaContentType(contentType)).toBe(expected);
  });
});

// ─── isLikelyAdOrTrackerHost ──────────────────────────────────────────────────

describe("isLikelyAdOrTrackerHost", () => {
  it.each([
    { hostname: "doubleclick.net", expected: true },
    { hostname: "google-analytics.com", expected: true },
    { hostname: "example.com", expected: false },
    { hostname: "sub.doubleclick.net", expected: true },
    { hostname: "analytics.example.com", expected: true },
  ])("returns $expected for hostname=$hostname", ({ hostname, expected }) => {
    expect(isLikelyAdOrTrackerHost(hostname)).toBe(expected);
  });
});

// ─── isSameOrigin ─────────────────────────────────────────────────────────────

describe("isSameOrigin", () => {
  it.each([
    { source: "https://example.com/page", compare: "https://example.com/other", expected: true },
    { source: "https://example.com", compare: "https://other.com/page", expected: false },
    { source: "https://example.com", compare: null, expected: false },
    { source: "https://example.com", compare: undefined, expected: false },
    { source: "invalid-url", compare: "https://example.com", expected: false },
  ])("returns $expected for source=$source compare=$compare", ({ source, compare, expected }) => {
    expect(isSameOrigin(source, compare)).toBe(expected);
  });
});

// ─── isLikelyPlayerFrame ──────────────────────────────────────────────────────

describe("isLikelyPlayerFrame", () => {
  it.each([
    { url: "https://example.com/playvid/123", expected: true },
    { url: "https://example.com/embed/video", expected: true },
    { url: "https://example.com/player", expected: true },
    { url: "https://example.com/about", expected: false },
    { url: null, expected: false },
    { url: undefined, expected: false },
  ])("returns $expected for url=$url", ({ url, expected }) => {
    expect(isLikelyPlayerFrame(url)).toBe(expected);
  });
});

// ─── sanitizeCapturedHeaders ──────────────────────────────────────────────────

describe("sanitizeCapturedHeaders", () => {
  it("removes blocked headers", () => {
    const input = {
      host: "example.com",
      range: "bytes=0-100",
      "content-length": "1000",
      referer: "https://example.com",
    };
    const result = sanitizeCapturedHeaders(input);
    expect(result.host).toBeUndefined();
    expect(result.range).toBeUndefined();
    expect(result["content-length"]).toBeUndefined();
    expect(result.referer).toBe("https://example.com");
  });

  it("adds user-agent if missing", () => {
    const result = sanitizeCapturedHeaders({});
    expect(result["user-agent"]).toBe(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
  });

  it("preserves existing user-agent", () => {
    const result = sanitizeCapturedHeaders({ "user-agent": "custom-agent/1.0" });
    expect(result["user-agent"]).toBe("custom-agent/1.0");
  });

  it("keeps allowed headers intact", () => {
    const result = sanitizeCapturedHeaders({
      referer: "https://example.com",
      cookie: "session=abc",
      accept: "*/*",
    });
    expect(result.referer).toBe("https://example.com");
    expect(result.cookie).toBe("session=abc");
    expect(result.accept).toBe("*/*");
  });
});

// ─── buildMediaCandidateScore ─────────────────────────────────────────────────

describe("buildMediaCandidateScore", () => {
  const defaultParams = {
    targetUrl: "https://example.com/page",
    source: "response" as const,
  };

  it("penalizes ad/tracker URLs with negative score", () => {
    const score = buildMediaCandidateScore({
      ...defaultParams,
      url: "https://doubleclick.net/ad",
    });
    expect(score).toBeLessThan(0);
  });

  it("includes +500 for DOM source", () => {
    const score = buildMediaCandidateScore({
      ...defaultParams,
      url: "https://cdn.example.com/video",
      source: "dom",
    });
    expect(score).toBeGreaterThanOrEqual(500);
  });

  it("includes +500 for media resourceType", () => {
    const score = buildMediaCandidateScore({
      ...defaultParams,
      url: "https://cdn.example.com/video.mp4",
      resourceType: "media",
    });
    // resourceType media (+500) + media extension (+250) + cross-origin (+100) = 850
    expect(score).toBe(850);
  });

  it("includes +400 for video content-type", () => {
    const score = buildMediaCandidateScore({
      ...defaultParams,
      url: "https://cdn.example.com/stream",
      contentType: "video/mp4",
    });
    // content-type (+400) + cross-origin (+100) + cross-origin+noExt (+200) = 700
    expect(score).toBe(700);
  });

  it("penalizes same hostname as target by -150", () => {
    const score = buildMediaCandidateScore({
      ...defaultParams,
      url: "https://example.com/video.mp4",
    });
    // extension (+250) + cross-origin (false) + same-host (-150) = 100
    expect(score).toBe(100);
  });

  it("adds +200 for cross-origin with no known extension", () => {
    const score = buildMediaCandidateScore({
      ...defaultParams,
      url: "https://cdn.example.com/stream",
    });
    // cross-origin (+100) + cross-origin+noExt (+200) = 300
    expect(score).toBe(300);
  });

  it("adds +250 when frameUrl is same origin as target", () => {
    const score = buildMediaCandidateScore({
      ...defaultParams,
      url: "https://cdn.example.com/video.mp4",
      frameUrl: "https://example.com/player",
    });
    // extension (+250) + cross-origin (+100) + frame same origin (+250)
    // + player frame (+220) = 820
    expect(score).toBe(820);
  });

  it("adds +180 when referer is same origin as target", () => {
    const score = buildMediaCandidateScore({
      ...defaultParams,
      url: "https://cdn.example.com/video.mp4",
      referer: "https://example.com/page2",
    });
    // extension (+250) + cross-origin (+100) + referer same origin (+180) = 530
    expect(score).toBe(530);
  });

  it("adds +250 for vidhmm.com hostname", () => {
    const score = buildMediaCandidateScore({
      ...defaultParams,
      url: "https://vidhmm.com/video.mp4",
    });
    // extension (+250) + cross-origin (+100) + vidhmm (+250) = 600
    expect(score).toBe(600);
  });
});

// ─── pickBetterCandidate ──────────────────────────────────────────────────────

describe("pickBetterCandidate", () => {
  it("returns next when current is null", () => {
    const next = { url: "https://example.com/video.mp4", headersRequired: {}, score: 100 };
    expect(pickBetterCandidate(null, next)).toBe(next);
  });

  it("returns higher-scoring candidate", () => {
    const current = { url: "https://example.com/a.mp4", headersRequired: {}, score: 100 };
    const next = { url: "https://example.com/b.mp4", headersRequired: {}, score: 200 };
    expect(pickBetterCandidate(current, next)).toBe(next);
  });

  it("keeps current when next has lower score", () => {
    const current = { url: "https://example.com/a.mp4", headersRequired: {}, score: 200 };
    const next = { url: "https://example.com/b.mp4", headersRequired: {}, score: 100 };
    expect(pickBetterCandidate(current, next)).toBe(current);
  });

  it("prefers candidate with more headers when scores are equal", () => {
    const current = { url: "https://example.com/a.mp4", headersRequired: { referer: "x" }, score: 100 };
    const next = { url: "https://example.com/b.mp4", headersRequired: { referer: "x", cookie: "y" }, score: 100 };
    expect(pickBetterCandidate(current, next)).toBe(next);
  });

  it("keeps current when scores are equal and current has more headers", () => {
    const current = { url: "https://example.com/a.mp4", headersRequired: { referer: "x", cookie: "y" }, score: 100 };
    const next = { url: "https://example.com/b.mp4", headersRequired: { referer: "x" }, score: 100 };
    expect(pickBetterCandidate(current, next)).toBe(current);
  });
});

// ─── isLikelyMediaResponse ────────────────────────────────────────────────────

describe("isLikelyMediaResponse", () => {
  it("returns true for media resourceType", () => {
    expect(isLikelyMediaResponse("https://example.com/page", "media")).toBe(true);
  });

  it("returns true for URL with .mp4 extension", () => {
    expect(isLikelyMediaResponse("https://example.com/video.mp4", "other")).toBe(true);
  });

  it("returns true for video content-type", () => {
    expect(isLikelyMediaResponse("https://example.com/stream", "other", "video/mp4")).toBe(true);
  });

  it("returns false when no match", () => {
    expect(isLikelyMediaResponse("https://example.com/page.html", "document", "text/html")).toBe(false);
  });
});
