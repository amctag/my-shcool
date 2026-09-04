import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  CreateGradeFormBody,
  DashboardGradeFormClassesCourses,
  DashboardGradeFormDetail,
  DashboardGradeFormDetailsList,
  DashboardGradeFormExpressions,
  DashboardGradeFormExpressionTypes,
  DashboardGradeFormByClass,
  DashboardGradeFormsQuery,
  DashboardGradeFormsResponse,
  SaveGradeFormDetailBody,
  SaveGradeFormExpressionBody,
  SaveGradeFormExpressionsBody,
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
    getGradeFormExpressionTypes: builder.query<
      DashboardGradeFormExpressionTypes,
      { gradeFormId: number; detailId: number }
    >({
      query: ({ gradeFormId, detailId }) =>
        `/dashboard/grade-forms/${gradeFormId}/details/${detailId}/expression-types`,
      providesTags: (_result, _error, { gradeFormId, detailId }) => [
        {
          type: "DashboardGradeForms",
          id: `EXPRESSION_TYPES_${gradeFormId}`,
        },
        {
          type: "DashboardGradeForms",
          id: `EXPRESSION_TYPES_${gradeFormId}_${detailId}`,
        },
      ],
    }),
    getGradeFormExpressions: builder.query<
      DashboardGradeFormExpressions,
      { gradeFormId: number; detailId: number }
    >({
      query: ({ gradeFormId, detailId }) =>
        `/dashboard/grade-forms/${gradeFormId}/details/${detailId}/percentages`,
      providesTags: (_result, _error, { gradeFormId, detailId }) => [
        {
          type: "DashboardGradeForms",
          id: `EXPRESSIONS_${gradeFormId}_${detailId}`,
        },
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
        { type: "DashboardGradeForms", id: `EXPRESSION_TYPES_${gradeFormId}` },
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
        { type: "DashboardGradeForms", id: `EXPRESSION_TYPES_${gradeFormId}` },
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
        { type: "DashboardGradeForms", id: `EXPRESSION_TYPES_${gradeFormId}` },
      ],
    }),
    replaceGradeFormExpressions: builder.mutation<
      DashboardGradeFormDetailsList,
      {
        gradeFormId: number;
        detailId: number;
        body: SaveGradeFormExpressionsBody;
      }
    >({
      query: ({ gradeFormId, detailId, body }) => ({
        url: `/dashboard/grade-forms/${gradeFormId}/details/${detailId}/percentages`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { gradeFormId, detailId }) => [
        { type: "DashboardGradeForms", id: `DETAILS_${gradeFormId}` },
        {
          type: "DashboardGradeForms",
          id: `EXPRESSION_TYPES_${gradeFormId}_${detailId}`,
        },
        {
          type: "DashboardGradeForms",
          id: `EXPRESSIONS_${gradeFormId}_${detailId}`,
        },
      ],
    }),
    createGradeFormExpression: builder.mutation<
      DashboardGradeFormDetailsList,
      {
        gradeFormId: number;
        detailId: number;
        body: SaveGradeFormExpressionBody;
      }
    >({
      query: ({ gradeFormId, detailId, body }) => ({
        url: `/dashboard/grade-forms/${gradeFormId}/details/${detailId}/percentages`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { gradeFormId, detailId }) => [
        { type: "DashboardGradeForms", id: `DETAILS_${gradeFormId}` },
        {
          type: "DashboardGradeForms",
          id: `EXPRESSION_TYPES_${gradeFormId}_${detailId}`,
        },
        {
          type: "DashboardGradeForms",
          id: `EXPRESSIONS_${gradeFormId}_${detailId}`,
        },
      ],
    }),
    deleteGradeFormExpression: builder.mutation<
      DashboardGradeFormDetailsList,
      { gradeFormId: number; detailId: number; percentageId: number }
    >({
      query: ({ gradeFormId, detailId, percentageId }) => ({
        url: `/dashboard/grade-forms/${gradeFormId}/details/${detailId}/percentages/${percentageId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { gradeFormId, detailId }) => [
        { type: "DashboardGradeForms", id: `DETAILS_${gradeFormId}` },
        {
          type: "DashboardGradeForms",
          id: `EXPRESSION_TYPES_${gradeFormId}_${detailId}`,
        },
        {
          type: "DashboardGradeForms",
          id: `EXPRESSIONS_${gradeFormId}_${detailId}`,
        },
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
  useGetGradeFormExpressionTypesQuery,
  useGetGradeFormExpressionsQuery,
  useCreateGradeFormMutation,
  useUpdateGradeFormMutation,
  useDeleteGradeFormMutation,
  useUpdateGradeFormClassesMutation,
  useCreateGradeFormDetailMutation,
  useUpdateGradeFormDetailMutation,
  useDeleteGradeFormDetailMutation,
  useReplaceGradeFormExpressionsMutation,
  useCreateGradeFormExpressionMutation,
  useDeleteGradeFormExpressionMutation,
} = gradeFormsApi;
