import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardAlbum,
  DashboardAlbumsQuery,
  DashboardAlbumsResponse,
  SaveAlbumBody,
} from "@/features/school/types";

export const dashboardAlbumsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardAlbums: builder.query<
      DashboardAlbumsResponse,
      DashboardAlbumsQuery | void
    >({
      query: (params) =>
        `/dashboard/albums${toQueryString({
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
                type: "DashboardAlbums" as const,
                id: item.id,
              })),
              { type: "DashboardAlbums", id: "LIST" },
            ]
          : [{ type: "DashboardAlbums", id: "LIST" }],
    }),
    getDashboardAlbum: builder.query<DashboardAlbum, number>({
      query: (id) => `/dashboard/albums/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "DashboardAlbums", id },
      ],
    }),
    createDashboardAlbum: builder.mutation<DashboardAlbum, SaveAlbumBody>({
      query: (body) => ({
        url: "/dashboard/albums",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DashboardAlbums", id: "LIST" }],
    }),
    updateDashboardAlbum: builder.mutation<
      DashboardAlbum,
      { id: number; body: SaveAlbumBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/albums/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "DashboardAlbums", id },
        { type: "DashboardAlbums", id: "LIST" },
      ],
    }),
    deleteDashboardAlbum: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/albums/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "DashboardAlbums", id },
        { type: "DashboardAlbums", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetDashboardAlbumsQuery,
  useGetDashboardAlbumQuery,
  useCreateDashboardAlbumMutation,
  useUpdateDashboardAlbumMutation,
  useDeleteDashboardAlbumMutation,
} = dashboardAlbumsApi;
