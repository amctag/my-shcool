import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardDirectorDetail,
  DashboardDirectorsQuery,
  DashboardDirectorsResponse,
  SaveDirectorBody,
} from "@/features/school/types";

export const directorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDirectors: builder.query<
      DashboardDirectorsResponse,
      DashboardDirectorsQuery
    >({
      query: ({
        page,
        limit,
        search,
        name,
        firstName,
        middleName,
        lastName,
        id,
        status,
        sortBy,
        sortOrder,
      }) =>
        `/dashboard/directors${toQueryString({
          page,
          limit,
          search,
          name,
          firstName,
          middleName,
          lastName,
          id,
          status,
          sortBy,
          sortOrder,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((director) => ({
                type: "Directors" as const,
                id: director.id,
              })),
              { type: "Directors", id: "LIST" },
            ]
          : [{ type: "Directors", id: "LIST" }],
    }),
    getDirector: builder.query<DashboardDirectorDetail, number>({
      query: (id) => `/dashboard/directors/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Directors", id }],
    }),
    createDirector: builder.mutation<
      DashboardDirectorDetail,
      SaveDirectorBody
    >({
      query: (body) => ({
        url: "/dashboard/directors",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Directors", id: "LIST" }],
    }),
    updateDirector: builder.mutation<
      DashboardDirectorDetail,
      { id: number; body: SaveDirectorBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/directors/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Directors", id },
        { type: "Directors", id: "LIST" },
      ],
    }),
    updateDirectorStatus: builder.mutation<
      { id: number; status: boolean },
      { id: number; status: boolean }
    >({
      query: ({ id, status }) => ({
        url: `/dashboard/directors/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Directors", id },
        { type: "Directors", id: "LIST" },
      ],
    }),
    resetDirectorPassword: builder.mutation<
      { id: number; reset: boolean },
      { id: number; body: { newPassword: string; confirmPassword: string } }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/directors/${id}/password`,
        method: "PATCH",
        body,
      }),
    }),
  }),
});

export const {
  useGetDirectorsQuery,
  useLazyGetDirectorsQuery,
  useGetDirectorQuery,
  useCreateDirectorMutation,
  useUpdateDirectorMutation,
  useUpdateDirectorStatusMutation,
  useResetDirectorPasswordMutation,
} = directorsApi;
