import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardAnnouncement,
  DashboardAnnouncementsQuery,
  DashboardAnnouncementsResponse,
  SaveAnnouncementBody,
} from "@/features/school/types";

export const dashboardAnnouncementsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardAnnouncements: builder.query<
      DashboardAnnouncementsResponse,
      DashboardAnnouncementsQuery | void
    >({
      query: (params) =>
        `/dashboard/announcements${toQueryString({
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          search: params?.search,
          yearId: params?.yearId,
          classId: params?.classId,
          sectionId: params?.sectionId,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "DashboardAnnouncements" as const,
                id: item.id,
              })),
              { type: "DashboardAnnouncements", id: "LIST" },
            ]
          : [{ type: "DashboardAnnouncements", id: "LIST" }],
    }),
    getDashboardAnnouncement: builder.query<DashboardAnnouncement, number>({
      query: (id) => `/dashboard/announcements/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "DashboardAnnouncements", id },
      ],
    }),
    createDashboardAnnouncement: builder.mutation<
      DashboardAnnouncement,
      SaveAnnouncementBody
    >({
      query: (body) => ({
        url: "/dashboard/announcements",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DashboardAnnouncements", id: "LIST" }],
    }),
  }),
});

export const {
  useGetDashboardAnnouncementsQuery,
  useGetDashboardAnnouncementQuery,
  useCreateDashboardAnnouncementMutation,
} = dashboardAnnouncementsApi;
