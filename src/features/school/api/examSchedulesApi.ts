import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardExamScheduleDetail,
  DashboardExamSchedulesQuery,
  DashboardExamSchedulesResponse,
  DashboardGradeTypesResponse,
  SaveExamScheduleBody,
} from "@/features/school/types";

export const dashboardExamSchedulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardGradeTypes: builder.query<DashboardGradeTypesResponse, void>({
      query: () => "/dashboard/exam-schedules/grade-types",
      keepUnusedDataFor: 300,
      providesTags: [{ type: "DashboardExamSchedules", id: "GRADE_TYPES" }],
    }),
    getDashboardExamSchedules: builder.query<
      DashboardExamSchedulesResponse,
      DashboardExamSchedulesQuery
    >({
      query: ({ page, limit, search, yearId, classId, sortBy, sortOrder }) =>
        `/dashboard/exam-schedules${toQueryString({
          page,
          limit,
          search,
          yearId,
          classId,
          sortBy,
          sortOrder,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "DashboardExamSchedules" as const,
                id: item.id,
              })),
              { type: "DashboardExamSchedules", id: "LIST" },
            ]
          : [{ type: "DashboardExamSchedules", id: "LIST" }],
    }),
    getDashboardExamSchedule: builder.query<DashboardExamScheduleDetail, number>({
      query: (id) => `/dashboard/exam-schedules/${id}`,
      keepUnusedDataFor: 120,
      providesTags: (_result, _error, id) => [
        { type: "DashboardExamSchedules", id },
      ],
    }),
    createDashboardExamSchedule: builder.mutation<
      DashboardExamScheduleDetail,
      SaveExamScheduleBody
    >({
      query: (body) => ({
        url: "/dashboard/exam-schedules",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DashboardExamSchedules", id: "LIST" }],
    }),
    updateDashboardExamSchedule: builder.mutation<
      DashboardExamScheduleDetail,
      { id: number; body: SaveExamScheduleBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/exam-schedules/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "DashboardExamSchedules", id },
        { type: "DashboardExamSchedules", id: "LIST" },
      ],
    }),
    deleteDashboardExamSchedule: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/exam-schedules/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "DashboardExamSchedules", id },
        { type: "DashboardExamSchedules", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetDashboardGradeTypesQuery,
  useGetDashboardExamSchedulesQuery,
  useGetDashboardExamScheduleQuery,
  useCreateDashboardExamScheduleMutation,
  useUpdateDashboardExamScheduleMutation,
  useDeleteDashboardExamScheduleMutation,
} = dashboardExamSchedulesApi;
