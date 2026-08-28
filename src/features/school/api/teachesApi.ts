import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardTeach,
  DashboardTeachesQuery,
  DashboardTeachesResponse,
  SaveTeachBody,
} from "@/features/school/types";

export const teachesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeaches: builder.query<DashboardTeachesResponse, DashboardTeachesQuery>({
      query: ({
        page,
        limit,
        search,
        classId,
        sectionId,
        courseId,
        teacherId,
        yearId,
        sortBy,
        sortOrder,
      }) =>
        `/dashboard/teaches${toQueryString({
          page,
          limit,
          search,
          classId,
          sectionId,
          courseId,
          teacherId,
          yearId,
          sortBy,
          sortOrder,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "Teaches" as const,
                id: item.id,
              })),
              { type: "Teaches", id: "LIST" },
            ]
          : [{ type: "Teaches", id: "LIST" }],
    }),
    getTeach: builder.query<DashboardTeach, number>({
      query: (id) => `/dashboard/teaches/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Teaches", id }],
    }),
    createTeach: builder.mutation<DashboardTeach, SaveTeachBody>({
      query: (body) => ({
        url: "/dashboard/teaches",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Teaches", id: "LIST" }],
    }),
    updateTeach: builder.mutation<
      DashboardTeach,
      { id: number; body: SaveTeachBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/teaches/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Teaches", id },
        { type: "Teaches", id: "LIST" },
      ],
    }),
    deleteTeach: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/teaches/${id}`,
        method: "DELETE",
        responseHandler: async (response) => {
          await response.text();
          return undefined;
        },
      }),
      invalidatesTags: [{ type: "Teaches", id: "LIST" }],
    }),
  }),
});

export const {
  useGetTeachesQuery,
  useGetTeachQuery,
  useCreateTeachMutation,
  useUpdateTeachMutation,
  useDeleteTeachMutation,
} = teachesApi;
