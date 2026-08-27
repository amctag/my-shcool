"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  selectAuthReady,
  selectIsAuthenticated,
} from "@/features/auth/authSlice";
import { useAppSelector } from "@/store/hooks";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const ready = useAppSelector(selectAuthReady);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace("/login");
    }
  }, [ready, isAuthenticated, router]);

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center text-sm text-muted">
        Checking school session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
