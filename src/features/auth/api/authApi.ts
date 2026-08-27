import { baseApi } from "@/store/api/baseApi";
import { setCredentials, clearCredentials } from "@/features/auth/authSlice";
import type {
  SchoolAccessToken,
  SchoolLoginRequest,
  SchoolLogoutResponse,
  SchoolMe,
} from "@/features/auth/types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<SchoolAccessToken, SchoolLoginRequest>({
      query: (body) => ({
        url: "/school/login",
        method: "POST",
        body,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              accessToken: data.accessToken,
              accessTokenExpiresAt: data.accessTokenExpiresAt,
              name: data.name,
              schoolId: data.schoolId,
              schoolName: data.schoolName,
            }),
          );
        } catch {
          // Login errors stay in the mutation result.
        }
      },
    }),
    refresh: builder.mutation<SchoolAccessToken, void>({
      query: () => ({
        url: "/school/refresh",
        method: "POST",
        timeout: 8_000,
      }),
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              accessToken: data.accessToken,
              accessTokenExpiresAt: data.accessTokenExpiresAt,
              name: data.name,
              schoolId: data.schoolId,
              schoolName: data.schoolName,
            }),
          );
        } catch {
          const token = (
            getState() as unknown as { auth: { accessToken: string | null } }
          ).auth.accessToken;
          if (!token) {
            dispatch(clearCredentials());
          }
        }
      },
    }),
    logout: builder.mutation<SchoolLogoutResponse, void>({
      query: () => ({
        url: "/school/logout",
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(clearCredentials());
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),
    getSchoolMe: builder.query<SchoolMe, void>({
      query: () => "/school/me",
      providesTags: ["School"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useGetSchoolMeQuery,
} = authApi;
