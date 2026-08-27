import { NextRequest } from "next/server";

const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:3000";
const SCHOOL_COOKIE = "school_rt";
const SCHOOL_COOKIE_PATH = "/api/v1/school";
const UPSTREAM_TIMEOUT_MS = 8_000;

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function rewriteSetCookieForDashboard(
  setCookie: string,
  isHttps: boolean,
): string {
  const parts = setCookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  const nameValue = parts[0];
  if (!nameValue) {
    return setCookie;
  }

  const rewritten = [
    nameValue,
    `Path=${SCHOOL_COOKIE_PATH}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (isHttps) {
    rewritten.push("Secure");
  }

  for (const part of parts.slice(1)) {
    const lower = part.toLowerCase();
    if (lower.startsWith("expires=") || lower.startsWith("max-age=")) {
      rewritten.push(part);
    }
  }

  return rewritten.join("; ");
}

function expireLegacyRootCookie(isHttps: boolean): string {
  const parts = [
    `${SCHOOL_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (isHttps) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

async function proxySchoolAuth(request: NextRequest, path: string[]) {
  const target = `${apiOrigin}/api/v1/school/${path.join("/")}`;
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  if (cookie) {
    headers.set("cookie", cookie);
  }
  if (authorization) {
    headers.set("authorization", authorization);
  }
  if (contentType) {
    headers.set("content-type", contentType);
  }
  headers.set("accept", "application/json");
  headers.set("x-requested-with", "XMLHttpRequest");

  const canHaveBody = request.method !== "GET" && request.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: canHaveBody ? await request.text() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return Response.json(
      {
        message:
          "Cannot reach the API. Check API_ORIGIN in .env.local and that the Nest server is running.",
      },
      { status: 503 },
    );
  }

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) {
    responseHeaders.set("content-type", upstreamType);
  }

  const isHttps = request.nextUrl.protocol === "https:";
  const setCookies = upstream.headers.getSetCookie();
  if (setCookies.length > 0) {
    responseHeaders.append("set-cookie", expireLegacyRootCookie(isHttps));
  }
  for (const cookieValue of setCookies) {
    responseHeaders.append(
      "set-cookie",
      rewriteSetCookieForDashboard(cookieValue, isHttps),
    );
  }

  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxySchoolAuth(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxySchoolAuth(request, path);
}
