import { baseApi } from "@/store/api/baseApi";
import type { DashboardClass } from "@/features/school/types";

export const classesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClasses: builder.query<DashboardClass[], void>({
      query: () => "/dashboard/classes",
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.map((item) => ({
                type: "Classes" as const,
                id: item.id,
              })),
              { type: "Classes", id: "LIST" },
            ]
          : [{ type: "Classes", id: "LIST" }],
    }),
  }),
});

export const { useGetClassesQuery } = classesApi;
