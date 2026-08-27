import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardParentDetail,
  DashboardParentOption,
  DashboardParentsQuery,
  DashboardParentsResponse,
  SaveParentBody,
} from "@/features/school/types";

export const parentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getParents: builder.query<DashboardParentsResponse, DashboardParentsQuery>({
      query: ({ page, limit, search, name, id, sortBy, sortOrder }) =>
        `/dashboard/parents${toQueryString({ page, limit, search, name, id, sortBy, sortOrder })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((parent) => ({
                type: "Parents" as const,
                id: parent.id,
              })),
              { type: "Parents", id: "LIST" },
            ]
          : [{ type: "Parents", id: "LIST" }],
    }),
    getParentOptions: builder.query<DashboardParentOption[], string>({
      query: (search) =>
        `/dashboard/parents/options${toQueryString({ search })}`,
      providesTags: [{ type: "Parents", id: "OPTIONS" }],
    }),
    getParent: builder.query<DashboardParentDetail, number>({
      query: (id) => `/dashboard/parents/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Parents", id }],
    }),
    createParent: builder.mutation<DashboardParentDetail, SaveParentBody>({
      query: (body) => ({
        url: "/dashboard/parents",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Parents", id: "LIST" }, { type: "Parents", id: "OPTIONS" }],
    }),
    updateParent: builder.mutation<
      DashboardParentDetail,
      { id: number; body: SaveParentBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/parents/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Parents", id },
        { type: "Parents", id: "LIST" },
        { type: "Parents", id: "OPTIONS" },
      ],
    }),
    deleteParent: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/parents/${id}`,
        method: "DELETE",
        responseHandler: async (response) => {
          await response.text();
          return undefined;
        },
      }),
      invalidatesTags: [
        { type: "Parents", id: "LIST" },
        { type: "Parents", id: "OPTIONS" },
        { type: "Students", id: "LIST" },
        { type: "Child", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetParentsQuery,
  useGetParentOptionsQuery,
  useGetParentQuery,
  useCreateParentMutation,
  useUpdateParentMutation,
  useDeleteParentMutation,
} = parentsApi;
