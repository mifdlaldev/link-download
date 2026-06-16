export class ExtractError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly debug?: string[];

  constructor(message: string, statusCode: number = 500, code?: string, debug?: string[]) {
    super(message);
    this.name = "ExtractError";
    this.statusCode = statusCode;
    this.code = code;
    this.debug = debug;
  }
}

export class BrowserMissingError extends ExtractError {
  constructor() {
    super(
      'Playwright Chromium is not installed. Run "npm run playwright:install" in the backend folder, then restart the server.',
      503,
      "PLAYWRIGHT_BROWSER_MISSING",
    );
    this.name = "BrowserMissingError";
  }
}

export class NoMediaFoundError extends ExtractError {
  constructor(debug?: string[]) {
    super("Failed to extract video stream from the provided URL.", 404, "NO_MEDIA_FOUND", debug);
    this.name = "NoMediaFoundError";
  }
}

export class UpstreamFetchError extends ExtractError {
  constructor(public readonly upstreamStatus: number) {
    super("Upstream download request failed.", 502, "UPSTREAM_FAILED");
    this.name = "UpstreamFetchError";
  }
}

export class ValidationError extends ExtractError {
  constructor(public readonly issues: unknown) {
    super("Validation Error", 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}
