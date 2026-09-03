import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardGradeByCourseCandidates,
  DashboardGradeByCourseDetail,
  DashboardGradeCardQuery,
  DashboardGradeCardResponse,
  DashboardGradesByCourseQuery,
  DashboardGradesByCourseResponse,
  DashboardGradeTypeListItem,
  DashboardGradeTypesListResponse,
  SaveGradeByCourseBody,
  SaveGradeTypeBody,
} from "@/features/school/types";

export const gradesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardGradeTypesList: builder.query<
      DashboardGradeTypesListResponse,
      { includeInactive?: boolean } | void
    >({
      query: (arg) =>
        `/dashboard/grades/grade-types${toQueryString({
          includeInactive: arg?.includeInactive ? true : undefined,
        })}`,
      keepUnusedDataFor: 300,
      providesTags: [{ type: "DashboardGrades", id: "GRADE_TYPES" }],
    }),
    getGradeCard: builder.query<
      DashboardGradeCardResponse,
      DashboardGradeCardQuery
    >({
      query: ({ registrationId, yearId, classId, sectionId }) =>
        `/dashboard/grades/grade-card${toQueryString({
          registrationId,
          yearId,
          classId,
          sectionId,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: (_result, _error, { registrationId }) => [
        { type: "DashboardGrades", id: `GRADE_CARD_${registrationId}` },
      ],
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
        ...(result
          ? result.students.map((student) => ({
              type: "DashboardGrades" as const,
              id: `GRADE_CARD_${student.registrationId}`,
            }))
          : []),
        ...(result ? [{ type: "DashboardGrades" as const, id: result.id }] : []),
      ],
    }),
    createGradeType: builder.mutation<
      DashboardGradeTypeListItem,
      SaveGradeTypeBody
    >({
      query: (body) => ({
        url: "/dashboard/grades/grade-types",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DashboardGrades", id: "GRADE_TYPES" }],
    }),
    updateGradeType: builder.mutation<
      DashboardGradeTypeListItem,
      { id: number; body: SaveGradeTypeBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/grades/grade-types/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "DashboardGrades", id: "GRADE_TYPES" }],
    }),
  }),
});

export const {
  useGetDashboardGradeTypesListQuery,
  useGetGradeCardQuery,
  useGetGradesByCourseQuery,
  useGetGradeByCourseQuery,
  useGetGradeByCourseCandidatesQuery,
  useLazyGetGradeByCourseCandidatesQuery,
  useSaveGradeByCourseMutation,
  useCreateGradeTypeMutation,
  useUpdateGradeTypeMutation,
} = gradesApi;
