import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardAttendanceDetail,
  DashboardAttendanceSheet,
  DashboardAttendancesQuery,
  DashboardAttendancesResponse,
  SaveAttendanceBody,
} from "@/features/school/types";

export const attendancesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAttendances: builder.query<
      DashboardAttendancesResponse,
      DashboardAttendancesQuery
    >({
      query: ({
        page,
        limit,
        yearId,
        classId,
        sectionId,
        status,
        date,
        search,
        sortBy,
        sortOrder,
      }) =>
        `/dashboard/attendances${toQueryString({
          page,
          limit,
          yearId,
          classId,
          sectionId,
          status,
          date,
          search,
          sortBy,
          sortOrder,
        })}`,
      keepUnusedDataFor: 60,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "DashboardAttendances" as const,
                id: item.id,
              })),
              { type: "DashboardAttendances", id: "LIST" },
            ]
          : [{ type: "DashboardAttendances", id: "LIST" }],
    }),
    getAttendanceSheet: builder.query<
      DashboardAttendanceSheet,
      { sectionId: number; date: string }
    >({
      query: ({ sectionId, date }) =>
        `/dashboard/attendances/sheet${toQueryString({ sectionId, date })}`,
      keepUnusedDataFor: 30,
      providesTags: (_result, _error, { sectionId, date }) => [
        { type: "DashboardAttendances", id: `SHEET_${sectionId}_${date}` },
      ],
    }),
    getAttendance: builder.query<DashboardAttendanceDetail, number>({
      query: (id) => `/dashboard/attendances/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: "DashboardAttendances", id },
      ],
    }),
    saveAttendance: builder.mutation<
      DashboardAttendanceDetail,
      SaveAttendanceBody
    >({
      query: (body) => ({
        url: "/dashboard/attendances",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: "DashboardAttendances", id: "LIST" },
        {
          type: "DashboardAttendances",
          id: `SHEET_${body.sectionId}_${body.date}`,
        },
        ...(_result?.attendanceId
          ? [{ type: "DashboardAttendances" as const, id: _result.attendanceId }]
          : []),
      ],
    }),
    deleteAttendance: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/attendances/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "DashboardAttendances", id },
        { type: "DashboardAttendances", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAttendancesQuery,
  useGetAttendanceSheetQuery,
  useLazyGetAttendanceSheetQuery,
  useGetAttendanceQuery,
  useSaveAttendanceMutation,
  useDeleteAttendanceMutation,
} = attendancesApi;
