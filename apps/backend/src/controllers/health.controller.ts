import type { IncomingMessage, ServerResponse } from "node:http";

import type { HealthService } from "../services/health.service.js";

const JSON_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'"
} as const;

function requestPath(request: IncomingMessage): string | undefined {
  try {
    return new URL(request.url ?? "/", "http://backend.local").pathname;
  } catch {
    return undefined;
  }
}

/** HTTP adapter for the three stable health endpoints. */
export class HealthController {
  public constructor(private readonly healthService: HealthService) {}

  public async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const method = (request.method ?? "GET").toUpperCase();
    const path = requestPath(request);

    if (method !== "GET" && method !== "HEAD") {
      this.writeJson(
        response,
        405,
        { error: "method_not_allowed" },
        method === "HEAD",
        { Allow: "GET, HEAD" }
      );
      return;
    }

    if (path === undefined) {
      this.writeJson(response, 400, { error: "invalid_request_target" }, method === "HEAD");
      return;
    }

    try {
      if (path === "/health/live") {
        this.writeJson(response, 200, this.healthService.getLiveness(), method === "HEAD");
        return;
      }

      if (path === "/health/ready") {
        const report = await this.healthService.getReadiness();
        this.writeJson(response, report.ready ? 200 : 503, report, method === "HEAD");
        return;
      }

      if (path === "/health") {
        const report = await this.healthService.getHealth();
        this.writeJson(response, report.ready ? 200 : 503, report, method === "HEAD");
        return;
      }

      this.writeJson(response, 404, { error: "not_found" }, method === "HEAD");
    } catch {
      // Do not expose dependency or adapter errors through a public probe.
      this.writeJson(response, 503, { error: "healthcheck_unavailable" }, method === "HEAD");
    }
  }

  private writeJson(
    response: ServerResponse,
    statusCode: number,
    body: unknown,
    headOnly: boolean,
    extraHeaders: Record<string, string> = {}
  ): void {
    const payload = JSON.stringify(body);
    response.writeHead(statusCode, {
      ...JSON_HEADERS,
      "Content-Length": Buffer.byteLength(payload),
      ...extraHeaders
    });
    response.end(headOnly ? undefined : payload);
  }
}
