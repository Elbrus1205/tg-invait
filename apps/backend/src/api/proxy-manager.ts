import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { Socket } from "node:net";
import { performance } from "node:perf_hooks";

import type { ProxyProtocol, ProxyStatus } from "@prisma/client";

export interface ParsedProxyLine {
  readonly host: string;
  readonly port: number;
  readonly username?: string;
  readonly password?: string;
}

export interface ProxyCheckResult {
  readonly status: ProxyStatus;
  readonly pingMs?: number;
  readonly errorCode?: string;
}

export interface ProxyCheckTarget {
  readonly id: string;
  readonly host: string;
  readonly port: number;
  readonly protocol: ProxyProtocol;
  readonly username?: string;
  readonly password?: string;
}

export interface ProxyChecker {
  check(proxy: ProxyCheckTarget): Promise<ProxyCheckResult>;
}

const HOST_PATTERN = /^[a-zA-Z0-9._:-]+$/;

export function parseProxyLine(line: string): ParsedProxyLine | undefined {
  const value = line.trim();
  if (value.length === 0 || value.startsWith("#")) return undefined;

  const credentialMatch = value.match(/^([^:@\s]+):([^@\s]*)@(.+)$/);
  if (credentialMatch) return parseHostPort(credentialMatch[3]!, credentialMatch[1], credentialMatch[2]);

  const parts = value.split(":");
  if (parts.length === 4) return parseHostPort(`${parts[0]}:${parts[1]}`, parts[2], parts[3]);
  if (parts.length === 2) return parseHostPort(value);
  return undefined;
}

function parseHostPort(value: string, username?: string, password?: string): ParsedProxyLine | undefined {
  const separator = value.lastIndexOf(":");
  if (separator <= 0) return undefined;
  const host = value.slice(0, separator).trim();
  const port = Number(value.slice(separator + 1));
  if (!HOST_PATTERN.test(host) || !Number.isInteger(port) || port < 1 || port > 65535) return undefined;
  return { host, port, ...(username === undefined ? {} : { username }), ...(password === undefined ? {} : { password }) };
}

export class NetworkProxyChecker implements ProxyChecker {
  public constructor(private readonly timeoutMs = 5_000) {}

  public async check(proxy: ProxyCheckTarget): Promise<ProxyCheckResult> {
    const started = performance.now();
    try {
      if (proxy.protocol === "HTTP" || proxy.protocol === "HTTPS") {
        await this.checkHttp(proxy);
      } else {
        await this.checkSocks5(proxy);
      }
      return { status: "ONLINE", pingMs: Math.max(0, Math.round(performance.now() - started)) };
    } catch (error) {
      const code = error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : "proxy_unreachable";
      const status: ProxyStatus = code === "proxy_auth" ? "AUTHENTICATION_ERROR" : code === "ETIMEDOUT" || code === "timeout" ? "TIMEOUT" : "OFFLINE";
      return { status, errorCode: code };
    }
  }

  private checkHttp(proxy: ProxyCheckTarget): Promise<void> {
    return new Promise((resolve, reject) => {
      const transport = proxy.protocol === "HTTPS" ? httpsRequest : httpRequest;
      const request = transport({ host: proxy.host, port: proxy.port, method: "HEAD", path: "http://example.com/", timeout: this.timeoutMs, ...(proxy.username === undefined ? {} : { auth: `${proxy.username}:${proxy.password ?? ""}` }) }, (response) => { response.resume(); if (response.statusCode === 407) { reject(Object.assign(new Error("proxy_auth"), { code: "proxy_auth" })); return; } response.once("end", resolve); });
      request.once("timeout", () => request.destroy(new Error("timeout")));
      request.once("error", reject);
      request.end();
    });
  }

  private checkSocks5(proxy: ProxyCheckTarget): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new Socket();
      const fail = (error: Error): void => { socket.destroy(); reject(error); };
      socket.setTimeout(this.timeoutMs, () => fail(new Error("timeout")));
      socket.once("error", fail);
      socket.once("connect", () => { socket.write(Buffer.from([5, 1, proxy.username ? 2 : 0])); });
      socket.once("data", (data: Buffer) => { if (data[1] === 0xff) return fail(new Error("proxy_auth")); socket.destroy(); resolve(); });
      socket.connect(proxy.port, proxy.host);
    });
  }
}
