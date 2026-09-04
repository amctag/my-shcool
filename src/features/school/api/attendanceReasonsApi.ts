import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardAttendanceReason,
  SaveAttendanceReasonBody,
} from "@/features/school/types";

export const attendanceReasonsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAttendanceReasons: builder.query<
      DashboardAttendanceReason[],
      { activeOnly?: boolean } | void
    >({
      query: (args) =>
        `/dashboard/attendance-reasons${toQueryString({
          activeOnly: args?.activeOnly ? "true" : undefined,
        })}`,
      keepUnusedDataFor: 60,
      providesTags: (result) =>
        result
          ? [
              ...result.map((item) => ({
                type: "DashboardAttendanceReasons" as const,
                id: item.id,
              })),
              { type: "DashboardAttendanceReasons", id: "LIST" },
            ]
          : [{ type: "DashboardAttendanceReasons", id: "LIST" }],
    }),
    getAttendanceReason: builder.query<DashboardAttendanceReason, number>({
      query: (id) => `/dashboard/attendance-reasons/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: "DashboardAttendanceReasons", id },
      ],
    }),
    createAttendanceReason: builder.mutation<
      DashboardAttendanceReason,
      SaveAttendanceReasonBody
    >({
      query: (body) => ({
        url: "/dashboard/attendance-reasons",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DashboardAttendanceReasons", id: "LIST" }],
    }),
    updateAttendanceReason: builder.mutation<
      DashboardAttendanceReason,
      { id: number; body: SaveAttendanceReasonBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/attendance-reasons/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "DashboardAttendanceReasons", id },
        { type: "DashboardAttendanceReasons", id: "LIST" },
      ],
    }),
    deleteAttendanceReason: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/attendance-reasons/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "DashboardAttendanceReasons", id },
        { type: "DashboardAttendanceReasons", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAttendanceReasonsQuery,
  useGetAttendanceReasonQuery,
  useCreateAttendanceReasonMutation,
  useUpdateAttendanceReasonMutation,
  useDeleteAttendanceReasonMutation,
} = attendanceReasonsApi;
