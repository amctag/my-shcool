function withoutTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Browser calls this Next app at /api/v1 so the httpOnly refresh cookie
 * stays on the dashboard origin. Point API_ORIGIN at Nest; Next proxies it.
 */
const configured = process.env.NEXT_PUBLIC_API_URL?.trim();

export const apiBaseUrl = withoutTrailingSlash(
  configured && configured.startsWith("/")
    ? configured.endsWith("/api/v1")
      ? configured
      : `${withoutTrailingSlash(configured)}/api/v1`
    : "/api/v1",
);
