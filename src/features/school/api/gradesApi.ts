import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardGradeByCourseCandidates,
  DashboardGradeByCourseDetail,
  DashboardGradesByCourseQuery,
  DashboardGradesByCourseResponse,
  DashboardGradeTypesListResponse,
  SaveGradeByCourseBody,
} from "@/features/school/types";

export const gradesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardGradeTypesList: builder.query<
      DashboardGradeTypesListResponse,
      void
    >({
      query: () => "/dashboard/grades/grade-types",
      keepUnusedDataFor: 300,
      providesTags: [{ type: "DashboardGrades", id: "GRADE_TYPES" }],
    }),
    getGradesByCourse: builder.query<
      DashboardGradesByCourseResponse,
      DashboardGradesByCourseQuery
    >({
      query: ({
        page,
        limit,
        search,
        yearId,
        classId,
        sectionId,
        courseId,
        gradeTypeId,
        sortBy,
        sortOrder,
      }) =>
        `/dashboard/grades/by-course${toQueryString({
          page,
          limit,
          search,
          yearId,
          classId,
          sectionId,
          courseId,
          gradeTypeId,
          sortBy,
          sortOrder,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "DashboardGrades" as const,
                id: item.id,
              })),
              { type: "DashboardGrades", id: "BY_COURSE_LIST" },
            ]
          : [{ type: "DashboardGrades", id: "BY_COURSE_LIST" }],
    }),
    getGradeByCourse: builder.query<DashboardGradeByCourseDetail, number>({
      query: (id) => `/dashboard/grades/by-course/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "DashboardGrades", id },
      ],
    }),
    getGradeByCourseCandidates: builder.query<
      DashboardGradeByCourseCandidates,
      { sectionId: number; courseId: number; gradeTypeId: number }
    >({
      query: ({ sectionId, courseId, gradeTypeId }) =>
        `/dashboard/grades/by-course/candidates${toQueryString({
          sectionId,
          courseId,
          gradeTypeId,
        })}`,
      providesTags: [{ type: "DashboardGrades", id: "CANDIDATES" }],
    }),
    saveGradeByCourse: builder.mutation<
      DashboardGradeByCourseDetail,
      SaveGradeByCourseBody
    >({
      query: (body) => ({
        url: "/dashboard/grades/by-course",
        method: "POST",
        body,
      }),
      invalidatesTags: (result) => [
        { type: "DashboardGrades", id: "BY_COURSE_LIST" },
        { type: "DashboardGrades", id: "CANDIDATES" },
        ...(result ? [{ type: "DashboardGrades" as const, id: result.id }] : []),
      ],
    }),
  }),
});

export const {
  useGetDashboardGradeTypesListQuery,
  useGetGradesByCourseQuery,
  useGetGradeByCourseQuery,
  useGetGradeByCourseCandidatesQuery,
  useLazyGetGradeByCourseCandidatesQuery,
  useSaveGradeByCourseMutation,
} = gradesApi;
