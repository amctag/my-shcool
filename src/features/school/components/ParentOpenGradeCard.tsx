"use client";

import { useEffect, useMemo, useState } from "react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { apiBaseUrl } from "@/lib/env";
import type { DashboardGradeCardResponse } from "@/features/school/types";
import { GradeCardDocument } from "./OpenGradeTable";
import "./grade-card-document.css";

type ParentOpenGradeCardProps = {
  registrationId: number;
  yearId?: number;
  classId?: number;
  sectionId?: number;
};

function storageKey(registrationId: number): string {
  return `parent_grade_card_access_token:${registrationId}`;
}

/** Read token from query/hash once, then keep it in sessionStorage (Strict Mode safe). */
function takeAccessToken(registrationId: number): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const key = storageKey(registrationId);
  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get("accessToken")?.trim();
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const fromHash = hashParams.get("accessToken")?.trim();
  const token = fromQuery || fromHash || null;

  if (token) {
    sessionStorage.setItem(key, token);
    url.searchParams.delete("accessToken");
    hashParams.delete("accessToken");
    const nextHash = hashParams.toString();
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${nextHash ? `#${nextHash}` : ""}`,
    );
    return token;
  }

  return sessionStorage.getItem(key);
}

export function ParentOpenGradeCard({
  registrationId,
  yearId,
  classId,
  sectionId,
}: ParentOpenGradeCardProps) {
  const [data, setData] = useState<DashboardGradeCardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      registrationId: String(registrationId),
    });
    if (yearId != null && yearId > 0) {
      params.set("yearId", String(yearId));
    }
    if (classId != null && classId > 0) {
      params.set("classId", String(classId));
    }
    if (sectionId != null && sectionId > 0) {
      params.set("sectionId", String(sectionId));
    }
    return params.toString();
  }, [registrationId, yearId, classId, sectionId]);

  useEffect(() => {
    let cancelled = false;
    const token = takeAccessToken(registrationId);

    if (!token) {
      setLoading(false);
      setError(
        "Missing parent session. Open this grade card from the parent app.",
      );
      return;
    }

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/parent/me/grades/grade-card?${query}`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "omit",
          },
        );
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            message?: string | string[];
          } | null;
          const message = Array.isArray(body?.message)
            ? body.message.join(", ")
            : body?.message;
          if (response.status === 401) {
            sessionStorage.removeItem(storageKey(registrationId));
            throw new Error(
              message || "Session expired. Sign in again in the parent app.",
            );
          }
          throw new Error(
            message || `Could not load grade card (${response.status})`,
          );
        }
        const payload = (await response.json()) as DashboardGradeCardResponse;
        if (!cancelled) {
          setData(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load grade card",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [registrationId, query]);

  if (loading) {
    return (
      <div className="grade-card-page grade-card-page--parent-app">
        <div className="grade-card-loading">
          <LoadingDots label="Loading grade card" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grade-card-page grade-card-page--parent-app">
        <p className="grade-card-loading text-red-600" role="alert">
          {error ?? "Grade card not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="grade-card-page grade-card-page--parent-app">
      <div className="grade-card-toolbar">
        <span />
        <button type="button" onClick={() => window.print()}>
          Print / PDF
        </button>
      </div>
      <GradeCardDocument data={data} />
    </div>
  );
}
