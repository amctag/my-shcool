import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardActivitiesQuery,
  DashboardActivitiesResponse,
  DashboardActivity,
  SaveActivityBody,
} from "@/features/school/types";

export const dashboardActivitiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardActivities: builder.query<
      DashboardActivitiesResponse,
      DashboardActivitiesQuery | void
    >({
      query: (params) =>
        `/dashboard/activities${toQueryString({
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          search: params?.search,
          yearId: params?.yearId,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "DashboardActivities" as const,
                id: item.id,
              })),
              { type: "DashboardActivities", id: "LIST" },
            ]
          : [{ type: "DashboardActivities", id: "LIST" }],
    }),
    getDashboardActivity: builder.query<DashboardActivity, number>({
      query: (id) => `/dashboard/activities/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "DashboardActivities", id },
      ],
    }),
    createDashboardActivity: builder.mutation<
      DashboardActivity,
      SaveActivityBody
    >({
      query: (body) => ({
        url: "/dashboard/activities",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DashboardActivities", id: "LIST" }],
    }),
  }),
});

export const {
  useGetDashboardActivitiesQuery,
  useGetDashboardActivityQuery,
  useCreateDashboardActivityMutation,
} = dashboardActivitiesApi;
