import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === "object" && error !== null && "status" in error;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (!error) {
    return fallback;
  }

  if (isFetchBaseQueryError(error) && typeof error.data === "object" && error.data) {
    const message = (error.data as { message?: string | string[] }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    if (Array.isArray(message) && message.length > 0) {
      return message.join(", ");
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}

/**
 * Reads the `fieldErrors` map returned by the API validation pipe so a form can
 * show each message under its input instead of one generic banner.
 */
export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!isFetchBaseQueryError(error) || typeof error.data !== "object" || !error.data) {
    return {};
  }

  const fieldErrors = (error.data as { fieldErrors?: unknown }).fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(fieldErrors)) {
    if (typeof value === "string" && value.trim()) {
      result[key] = value;
    }
  }
  return result;
}
