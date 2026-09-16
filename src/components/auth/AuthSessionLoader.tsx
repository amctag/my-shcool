"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRefreshMutation } from "@/features/auth/api/authApi";
import { selectIsAuthenticated, setAuthReady } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const BOOT_TIMEOUT_MS = 8_000;

function isParentGradeCardPath(pathname: string | null): boolean {
  return Boolean(pathname?.startsWith("/parent-grade-card"));
}

export function AuthSessionLoader({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [refresh] = useRefreshMutation();

  useEffect(() => {
    if (isParentGradeCardPath(pathname)) {
      dispatch(setAuthReady());
      return;
    }

    if (isAuthenticated) {
      dispatch(setAuthReady());
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch(setAuthReady());
    }, BOOT_TIMEOUT_MS);

    refresh()
      .unwrap()
      .catch(() => undefined)
      .finally(() => {
        window.clearTimeout(timeoutId);
        dispatch(setAuthReady());
      });

    return () => {
      window.clearTimeout(timeoutId);
    };
    // Restore school session once when the app store mounts (skip parent grade card).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, pathname]);

  return children;
}
