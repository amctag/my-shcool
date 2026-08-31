import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardClassesQuery,
  DashboardClassesResponse,
  DashboardStage,
} from "@/features/school/types";

export const classesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClasses: builder.query<DashboardClassesResponse, DashboardClassesQuery | void>({
      query: (arg) => `/dashboard/classes${toQueryString(arg ?? {})}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "Classes" as const,
                id: item.id,
              })),
              { type: "Classes", id: "LIST" },
            ]
          : [{ type: "Classes", id: "LIST" }],
    }),
    getStages: builder.query<DashboardStage[], void>({
      query: () => "/dashboard/classes/stages",
      keepUnusedDataFor: 120,
      providesTags: [{ type: "Classes", id: "STAGES" }],
    }),
  }),
});

export const { useGetClassesQuery, useGetStagesQuery } = classesApi;
