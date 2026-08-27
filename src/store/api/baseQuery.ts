import { Mutex } from "async-mutex";
import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { apiBaseUrl } from "@/lib/env";
import {
  clearCredentials,
  selectAccessToken,
  setCredentials,
  type AuthState,
} from "@/features/auth/authSlice";
import type { SchoolAccessToken } from "@/features/auth/types";

const mutex = new Mutex();

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = selectAccessToken(getState() as { auth: AuthState });
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    headers.set("Accept", "application/json");
    headers.set("X-Requested-With", "XMLHttpRequest");
    return headers;
  },
});

function isAuthPath(url: string): boolean {
  return url.includes("/school/login") || url.includes("/school/refresh");
}

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const url = typeof args === "string" ? args : args.url;

  await mutex.waitForUnlock();

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401 || isAuthPath(typeof url === "string" ? url : "")) {
    return result;
  }

  if (mutex.isLocked()) {
    await mutex.waitForUnlock();
    return rawBaseQuery(args, api, extraOptions);
  }

  const release = await mutex.acquire();

  try {
    const refreshResult = await rawBaseQuery(
      {
        url: "/school/refresh",
        method: "POST",
        timeout: 8_000,
      },
      api,
      extraOptions,
    );

    const data = refreshResult.data as SchoolAccessToken | undefined;

    if (!data?.accessToken) {
      api.dispatch(clearCredentials());
      return result;
    }

    api.dispatch(
      setCredentials({
        accessToken: data.accessToken,
        accessTokenExpiresAt: data.accessTokenExpiresAt,
        name: data.name,
        schoolId: data.schoolId,
        schoolName: data.schoolName,
      }),
    );

    result = await rawBaseQuery(args, api, extraOptions);
  } finally {
    release();
  }

  return result;
};
