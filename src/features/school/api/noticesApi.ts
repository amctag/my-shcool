import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardNotice,
  DashboardNoticesQuery,
  DashboardNoticesResponse,
  SaveNoticeBody,
} from "@/features/school/types";

export const dashboardNoticesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardNotices: builder.query<
      DashboardNoticesResponse,
      DashboardNoticesQuery | void
    >({
      query: (params) =>
        `/dashboard/notices${toQueryString({
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          search: params?.search,
          yearId: params?.yearId,
          classId: params?.classId,
          sectionId: params?.sectionId,
          noticeTypeId: params?.noticeTypeId,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "DashboardNotices" as const,
                id: item.id,
              })),
              { type: "DashboardNotices", id: "LIST" },
            ]
          : [{ type: "DashboardNotices", id: "LIST" }],
    }),
    getDashboardNotice: builder.query<DashboardNotice, number>({
      query: (id) => `/dashboard/notices/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "DashboardNotices", id },
      ],
    }),
    createDashboardNotice: builder.mutation<DashboardNotice, SaveNoticeBody>({
      query: (body) => ({
        url: "/dashboard/notices",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "DashboardNotices", id: "LIST" },
        { type: "DashboardNoticeTypes", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetDashboardNoticesQuery,
  useGetDashboardNoticeQuery,
  useCreateDashboardNoticeMutation,
} = dashboardNoticesApi;
