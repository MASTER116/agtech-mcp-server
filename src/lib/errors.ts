export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    public readonly body: string,
  ) {
    super(`API error ${status} from ${url}: ${body.slice(0, 200)}`);
    this.name = "ApiError";
  }
}

export class RateLimitError extends ApiError {
  constructor(
    url: string,
    public readonly retryAfterMs: number,
  ) {
    super(429, url, `Rate limited. Retry after ${retryAfterMs}ms`);
    this.name = "RateLimitError";
  }
}

export class ValidationError extends Error {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(`Validation error on '${field}': ${message}`);
    this.name = "ValidationError";
  }
}

export class ConfigError extends Error {
  constructor(public readonly keyName: string) {
    super(`Missing configuration: ${keyName}. Set it in .env or environment variables.`);
    this.name = "ConfigError";
  }
}
