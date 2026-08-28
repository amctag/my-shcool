import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardClassCourse,
  DashboardClassCoursesQuery,
  DashboardClassCoursesResponse,
  DashboardCourse,
  SaveClassCourseBody,
  SaveCourseBody,
} from "@/features/school/types";

export const coursesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourses: builder.query<DashboardCourse[], string | void>({
      query: (search) =>
        `/dashboard/courses${toQueryString({
          search: typeof search === "string" ? search : undefined,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.map((item) => ({
                type: "Courses" as const,
                id: item.id,
              })),
              { type: "Courses", id: "LIST" },
            ]
          : [{ type: "Courses", id: "LIST" }],
    }),
    getCourse: builder.query<DashboardCourse, number>({
      query: (id) => `/dashboard/courses/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Courses", id }],
    }),
    createCourse: builder.mutation<DashboardCourse, SaveCourseBody>({
      query: (body) => ({
        url: "/dashboard/courses",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Courses", id: "LIST" }],
    }),
    updateCourse: builder.mutation<
      DashboardCourse,
      { id: number; body: SaveCourseBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/courses/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Courses", id },
        { type: "Courses", id: "LIST" },
        { type: "Courses", id: "CLASS_LIST" },
      ],
    }),
    deleteCourse: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/courses/${id}`,
        method: "DELETE",
        responseHandler: async (response) => {
          await response.text();
          return undefined;
        },
      }),
      invalidatesTags: [{ type: "Courses", id: "LIST" }],
    }),
    getClassCourses: builder.query<
      DashboardClassCoursesResponse,
      DashboardClassCoursesQuery
    >({
      query: ({
        page,
        limit,
        search,
        classId,
        courseId,
        yearId,
        status,
        sortBy,
        sortOrder,
      }) =>
        `/dashboard/class-courses${toQueryString({
          page,
          limit,
          search,
          classId,
          courseId,
          yearId,
          status,
          sortBy,
          sortOrder,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "Courses" as const,
                id: `class-${item.id}`,
              })),
              { type: "Courses", id: "CLASS_LIST" },
            ]
          : [{ type: "Courses", id: "CLASS_LIST" }],
    }),
    getClassCourse: builder.query<DashboardClassCourse, number>({
      query: (id) => `/dashboard/class-courses/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "Courses", id: `class-${id}` },
      ],
    }),
    createClassCourse: builder.mutation<DashboardClassCourse, SaveClassCourseBody>({
      query: (body) => ({
        url: "/dashboard/class-courses",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Courses", id: "CLASS_LIST" },
        { type: "Courses", id: "LIST" },
      ],
    }),
    updateClassCourse: builder.mutation<
      DashboardClassCourse,
      { id: number; body: SaveClassCourseBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/class-courses/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Courses", id: `class-${id}` },
        { type: "Courses", id: "CLASS_LIST" },
        { type: "Courses", id: "LIST" },
      ],
    }),
    deleteClassCourse: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/class-courses/${id}`,
        method: "DELETE",
        responseHandler: async (response) => {
          await response.text();
          return undefined;
        },
      }),
      invalidatesTags: [
        { type: "Courses", id: "CLASS_LIST" },
        { type: "Courses", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetCoursesQuery,
  useGetCourseQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useGetClassCoursesQuery,
  useGetClassCourseQuery,
  useCreateClassCourseMutation,
  useUpdateClassCourseMutation,
  useDeleteClassCourseMutation,
} = coursesApi;
