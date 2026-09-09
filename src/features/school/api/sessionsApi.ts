import { baseApi } from "@/store/api/baseApi";
import type {
  DashboardSession,
  SaveSessionBody,
} from "@/features/school/types";

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSessions: builder.query<DashboardSession[], void>({
      query: () => "/dashboard/sessions",
      keepUnusedDataFor: 60,
      providesTags: (result) =>
        result
          ? [
              ...result.map((item) => ({
                type: "DashboardSessions" as const,
                id: item.id,
              })),
              { type: "DashboardSessions", id: "LIST" },
            ]
          : [{ type: "DashboardSessions", id: "LIST" }],
    }),
    getSession: builder.query<DashboardSession, number>({
      query: (id) => `/dashboard/sessions/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: "DashboardSessions", id },
      ],
    }),
    createSession: builder.mutation<DashboardSession, SaveSessionBody>({
      query: (body) => ({
        url: "/dashboard/sessions",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DashboardSessions", id: "LIST" }],
    }),
    updateSession: builder.mutation<
      DashboardSession,
      { id: number; body: SaveSessionBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/sessions/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "DashboardSessions", id },
        { type: "DashboardSessions", id: "LIST" },
      ],
    }),
    deleteSession: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/sessions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "DashboardSessions", id },
        { type: "DashboardSessions", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSessionsQuery,
  useGetSessionQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useDeleteSessionMutation,
} = sessionsApi;
