import { baseApi } from "@/store/api/baseApi";
import type {
  DashboardNoticeType,
  SaveNoticeTypeBody,
} from "@/features/school/types";

export const noticeTypesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNoticeTypes: builder.query<DashboardNoticeType[], void>({
      query: () => "/dashboard/notice-types",
      keepUnusedDataFor: 60,
      providesTags: (result) =>
        result
          ? [
              ...result.map((item) => ({
                type: "DashboardNoticeTypes" as const,
                id: item.id,
              })),
              { type: "DashboardNoticeTypes", id: "LIST" },
            ]
          : [{ type: "DashboardNoticeTypes", id: "LIST" }],
    }),
    getNoticeType: builder.query<DashboardNoticeType, number>({
      query: (id) => `/dashboard/notice-types/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: "DashboardNoticeTypes", id },
      ],
    }),
    createNoticeType: builder.mutation<DashboardNoticeType, SaveNoticeTypeBody>({
      query: (body) => ({
        url: "/dashboard/notice-types",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DashboardNoticeTypes", id: "LIST" }],
    }),
    updateNoticeType: builder.mutation<
      DashboardNoticeType,
      { id: number; body: SaveNoticeTypeBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/notice-types/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "DashboardNoticeTypes", id },
        { type: "DashboardNoticeTypes", id: "LIST" },
      ],
    }),
    deleteNoticeType: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/notice-types/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "DashboardNoticeTypes", id },
        { type: "DashboardNoticeTypes", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetNoticeTypesQuery,
  useGetNoticeTypeQuery,
  useCreateNoticeTypeMutation,
  useUpdateNoticeTypeMutation,
  useDeleteNoticeTypeMutation,
} = noticeTypesApi;
