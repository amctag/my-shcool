import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardChildrenQuery,
  DashboardChildrenResponse,
} from "@/features/school/types";

export const childrenApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChildren: builder.query<DashboardChildrenResponse, DashboardChildrenQuery>({
      query: ({ page, limit, parentId, search, name, id }) =>
        `/dashboard/children${toQueryString({ page, limit, parentId, search, name, id })}`,
      keepUnusedDataFor: 120,
      providesTags: (result, _error, arg) =>
        result
          ? [
              ...result.items.map((child) => ({
                type: "Child" as const,
                id: child.id,
              })),
              {
                type: "Child",
                id: arg.parentId ? `LIST-${arg.parentId}` : "LIST",
              },
            ]
          : [
              {
                type: "Child",
                id: arg.parentId ? `LIST-${arg.parentId}` : "LIST",
              },
            ],
    }),
  }),
});

export const { useGetChildrenQuery } = childrenApi;
