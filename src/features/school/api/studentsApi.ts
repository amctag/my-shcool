import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardChildrenQuery,
  DashboardChildrenResponse,
  DashboardStudentDetail,
  SaveStudentBody,
} from "@/features/school/types";

export const studentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query<DashboardChildrenResponse, DashboardChildrenQuery>({
      query: ({ page, limit, parentId, search, name, id, sortBy, sortOrder }) =>
        `/dashboard/students${toQueryString({ page, limit, parentId, search, name, id, sortBy, sortOrder })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((student) => ({
                type: "Students" as const,
                id: student.id,
              })),
              { type: "Students", id: "LIST" },
            ]
          : [{ type: "Students", id: "LIST" }],
    }),
    getStudent: builder.query<DashboardStudentDetail, number>({
      query: (id) => `/dashboard/students/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Students", id }],
    }),
    createStudent: builder.mutation<DashboardStudentDetail, SaveStudentBody>({
      query: (body) => ({
        url: "/dashboard/students",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Students", id: "LIST" },
        { type: "Child", id: "LIST" },
        { type: "Parents", id: "LIST" },
      ],
    }),
    updateStudent: builder.mutation<
      DashboardStudentDetail,
      { id: number; body: SaveStudentBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/students/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Students", id },
        { type: "Students", id: "LIST" },
        { type: "Child", id: "LIST" },
        { type: "Parents", id: "LIST" },
      ],
    }),
    deleteStudent: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/students/${id}`,
        method: "DELETE",
        responseHandler: async (response) => {
          await response.text();
          return undefined;
        },
      }),
      invalidatesTags: [
        { type: "Students", id: "LIST" },
        { type: "Child", id: "LIST" },
        { type: "Parents", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} = studentsApi;
