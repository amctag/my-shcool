"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useLoginMutation } from "@/features/auth/api/authApi";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading, error }] = useLoginMutation();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await login({ email, password }).unwrap();
      router.replace("/overview");
    } catch {
      // Error is shown from mutation result.
    }
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={onSubmit}>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="school@greenvalley.edu"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1.5 h-11 w-full rounded-lg border border-border bg-white px-3 text-base outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1.5 h-11 w-full rounded-lg border border-border bg-white px-3 text-base outline-none focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {getApiErrorMessage(error, "Invalid email or password")}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isLoading}
        className="h-11 w-full cursor-pointer rounded-lg bg-primary text-sm font-medium text-on-primary transition-colors duration-200 hover:bg-primary-hover disabled:opacity-60"
      >
        {isLoading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
