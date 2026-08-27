"use client";

import { useEffect } from "react";
import { useRefreshMutation } from "@/features/auth/api/authApi";
import { selectIsAuthenticated, setAuthReady } from "@/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const BOOT_TIMEOUT_MS = 8_000;

export function AuthSessionLoader({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [refresh] = useRefreshMutation();

  useEffect(() => {
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
    // Restore session once when the app store mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  return children;
}
