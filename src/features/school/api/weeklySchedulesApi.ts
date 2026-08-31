import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardWeeklyScheduleGridQuery,
  DashboardWeeklyScheduleGridResponse,
  DashboardWeeklySchedulesGridsQuery,
  DashboardWeeklySchedulesGridsResponse,
  DashboardWeeklySchedulesQuery,
  DashboardWeeklySchedulesResponse,
  SaveWeeklyScheduleBody,
} from "@/features/school/types";

export const dashboardWeeklySchedulesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardWeeklySchedules: builder.query<
      DashboardWeeklySchedulesResponse,
      DashboardWeeklySchedulesQuery
    >({
      query: ({
        page,
        limit,
        search,
        yearId,
        classId,
        sectionId,
        sortBy,
        sortOrder,
      }) =>
        `/dashboard/weekly-schedules${toQueryString({
          page,
          limit,
          search,
          yearId,
          classId,
          sectionId,
          sortBy,
          sortOrder,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "DashboardWeeklySchedules" as const,
                id: item.id,
              })),
              { type: "DashboardWeeklySchedules", id: "LIST" },
            ]
          : [{ type: "DashboardWeeklySchedules", id: "LIST" }],
    }),
    getDashboardWeeklyScheduleGrid: builder.query<
      DashboardWeeklyScheduleGridResponse,
      DashboardWeeklyScheduleGridQuery
    >({
      query: ({ sectionId, yearId, classId }) =>
        `/dashboard/weekly-schedules/grid${toQueryString({
          sectionId,
          yearId,
          classId,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: (_result, _error, arg) => [
        { type: "DashboardWeeklySchedules", id: `GRID-${arg.sectionId}` },
      ],
    }),
    getDashboardWeeklyScheduleGrids: builder.query<
      DashboardWeeklySchedulesGridsResponse,
      DashboardWeeklySchedulesGridsQuery
    >({
      query: ({ yearId, classId, sectionId }) =>
        `/dashboard/weekly-schedules/grids${toQueryString({
          yearId,
          classId,
          sectionId,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: [{ type: "DashboardWeeklySchedules", id: "GRIDS" }],
    }),
    saveDashboardWeeklySchedule: builder.mutation<
      DashboardWeeklyScheduleGridResponse,
      SaveWeeklyScheduleBody
    >({
      query: (body) => ({
        url: "/dashboard/weekly-schedules",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "DashboardWeeklySchedules", id: "LIST" },
        { type: "DashboardWeeklySchedules", id: "GRIDS" },
        { type: "DashboardWeeklySchedules", id: `GRID-${arg.sectionId}` },
      ],
    }),
    deleteDashboardWeeklySchedule: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/weekly-schedules/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "DashboardWeeklySchedules", id },
        { type: "DashboardWeeklySchedules", id: "LIST" },
        { type: "DashboardWeeklySchedules", id: "GRIDS" },
      ],
    }),
  }),
});

export const {
  useGetDashboardWeeklySchedulesQuery,
  useGetDashboardWeeklyScheduleGridQuery,
  useGetDashboardWeeklyScheduleGridsQuery,
  useSaveDashboardWeeklyScheduleMutation,
  useDeleteDashboardWeeklyScheduleMutation,
} = dashboardWeeklySchedulesApi;
