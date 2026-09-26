import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardTeacherTask,
  DashboardTeacherTasksQuery,
  DashboardTeacherTasksResponse,
  SaveTeacherTaskBody,
} from "@/features/school/types";

export const dashboardTeacherTasksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardTeacherTasks: builder.query<
      DashboardTeacherTasksResponse,
      DashboardTeacherTasksQuery | void
    >({
      query: (params) =>
        `/dashboard/teacher-tasks${toQueryString({
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          search: params?.search,
        })}`,
      keepUnusedDataFor: 60,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "DashboardTeacherTasks" as const,
                id: item.id,
              })),
              { type: "DashboardTeacherTasks", id: "LIST" },
            ]
          : [{ type: "DashboardTeacherTasks", id: "LIST" }],
    }),
    createDashboardTeacherTask: builder.mutation<
      DashboardTeacherTask,
      SaveTeacherTaskBody
    >({
      query: (body) => ({
        url: "/dashboard/teacher-tasks",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DashboardTeacherTasks", id: "LIST" }],
    }),
  }),
});

export const {
  useGetDashboardTeacherTasksQuery,
  useCreateDashboardTeacherTaskMutation,
} = dashboardTeacherTasksApi;
