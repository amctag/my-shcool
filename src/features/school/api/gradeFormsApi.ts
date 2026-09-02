import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  CreateGradeFormBody,
  DashboardGradeFormClassesCourses,
  DashboardGradeFormDetail,
  DashboardGradeFormDetailsList,
  DashboardGradeFormByClass,
  DashboardGradeFormsQuery,
  DashboardGradeFormsResponse,
  SaveGradeFormDetailBody,
  UpdateGradeFormBody,
  UpdateGradeFormClassesBody,
} from "@/features/school/types";

export const gradeFormsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGradeForms: builder.query<
      DashboardGradeFormsResponse,
      DashboardGradeFormsQuery
    >({
      query: ({ page, limit, search, yearId, sortBy, sortOrder }) =>
        `/dashboard/grade-forms${toQueryString({
          page,
          limit,
          search,
          yearId,
          sortBy,
          sortOrder,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "DashboardGradeForms" as const,
                id: item.id,
              })),
              { type: "DashboardGradeForms", id: "LIST" },
            ]
          : [{ type: "DashboardGradeForms", id: "LIST" }],
    }),
    getGradeForm: builder.query<DashboardGradeFormDetail, number>({
      query: (id) => `/dashboard/grade-forms/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "DashboardGradeForms", id },
      ],
    }),
    getGradeFormByClass: builder.query<
      DashboardGradeFormByClass,
      { classId: number; yearId: number }
    >({
      query: ({ classId, yearId }) =>
        `/dashboard/grade-forms/by-class${toQueryString({ classId, yearId })}`,
      providesTags: (_result, _error, { classId, yearId }) => [
        { type: "DashboardGradeForms", id: `BY_CLASS_${classId}_${yearId}` },
      ],
    }),
    getGradeFormClassesCourses: builder.query<
      DashboardGradeFormClassesCourses,
      { id: number; classIds?: number[] }
    >({
      query: ({ id, classIds }) =>
        `/dashboard/grade-forms/${id}/classes-courses${toQueryString({
          classIds: classIds?.length ? classIds.join(",") : undefined,
        })}`,
      providesTags: (_result, _error, { id }) => [
        { type: "DashboardGradeForms", id: `CLASSES_${id}` },
      ],
    }),
    createGradeForm: builder.mutation<
      DashboardGradeFormDetail,
      CreateGradeFormBody
    >({
      query: (body) => ({
        url: "/dashboard/grade-forms",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DashboardGradeForms", id: "LIST" }],
    }),
    updateGradeForm: builder.mutation<
      DashboardGradeFormDetail,
      { id: number; body: UpdateGradeFormBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/grade-forms/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "DashboardGradeForms", id: "LIST" },
        { type: "DashboardGradeForms", id },
        { type: "DashboardGradeForms", id: `CLASSES_${id}` },
      ],
    }),
    deleteGradeForm: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/grade-forms/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "DashboardGradeForms", id: "LIST" },
        { type: "DashboardGradeForms", id },
        { type: "DashboardGradeForms", id: `CLASSES_${id}` },
        { type: "DashboardGradeForms", id: `DETAILS_${id}` },
      ],
    }),
    updateGradeFormClasses: builder.mutation<
      DashboardGradeFormClassesCourses,
      { id: number } & UpdateGradeFormClassesBody
    >({
      query: ({ id, classIds }) => ({
        url: `/dashboard/grade-forms/${id}/classes`,
        method: "PATCH",
        body: { classIds },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "DashboardGradeForms", id: "LIST" },
        { type: "DashboardGradeForms", id },
        { type: "DashboardGradeForms", id: `CLASSES_${id}` },
      ],
    }),
    getGradeFormDetails: builder.query<DashboardGradeFormDetailsList, number>({
      query: (id) => `/dashboard/grade-forms/${id}/details`,
      providesTags: (_result, _error, id) => [
        { type: "DashboardGradeForms", id: `DETAILS_${id}` },
      ],
    }),
    createGradeFormDetail: builder.mutation<
      DashboardGradeFormDetailsList,
      { gradeFormId: number; body: SaveGradeFormDetailBody }
    >({
      query: ({ gradeFormId, body }) => ({
        url: `/dashboard/grade-forms/${gradeFormId}/details`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { gradeFormId }) => [
        { type: "DashboardGradeForms", id: "LIST" },
        { type: "DashboardGradeForms", id: gradeFormId },
        { type: "DashboardGradeForms", id: `DETAILS_${gradeFormId}` },
      ],
    }),
    updateGradeFormDetail: builder.mutation<
      DashboardGradeFormDetailsList,
      {
        gradeFormId: number;
        detailId: number;
        body: SaveGradeFormDetailBody;
      }
    >({
      query: ({ gradeFormId, detailId, body }) => ({
        url: `/dashboard/grade-forms/${gradeFormId}/details/${detailId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { gradeFormId }) => [
        { type: "DashboardGradeForms", id: "LIST" },
        { type: "DashboardGradeForms", id: gradeFormId },
        { type: "DashboardGradeForms", id: `DETAILS_${gradeFormId}` },
      ],
    }),
    deleteGradeFormDetail: builder.mutation<
      DashboardGradeFormDetailsList,
      { gradeFormId: number; detailId: number }
    >({
      query: ({ gradeFormId, detailId }) => ({
        url: `/dashboard/grade-forms/${gradeFormId}/details/${detailId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { gradeFormId }) => [
        { type: "DashboardGradeForms", id: "LIST" },
        { type: "DashboardGradeForms", id: gradeFormId },
        { type: "DashboardGradeForms", id: `DETAILS_${gradeFormId}` },
      ],
    }),
  }),
});

export const {
  useGetGradeFormsQuery,
  useGetGradeFormQuery,
  useGetGradeFormByClassQuery,
  useGetGradeFormClassesCoursesQuery,
  useGetGradeFormDetailsQuery,
  useCreateGradeFormMutation,
  useUpdateGradeFormMutation,
  useDeleteGradeFormMutation,
  useUpdateGradeFormClassesMutation,
  useCreateGradeFormDetailMutation,
  useUpdateGradeFormDetailMutation,
  useDeleteGradeFormDetailMutation,
} = gradeFormsApi;
