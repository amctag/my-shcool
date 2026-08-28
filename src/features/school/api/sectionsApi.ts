import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardSection,
  DashboardSectionTitle,
  DashboardSectionsQuery,
  DashboardSectionsResponse,
  DashboardYear,
  SaveSectionBody,
  SaveSectionTitleBody,
} from "@/features/school/types";

export const sectionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSections: builder.query<DashboardSectionsResponse, DashboardSectionsQuery>({
      query: ({ page, limit, search, classId, sortBy, sortOrder }) =>
        `/dashboard/sections${toQueryString({ page, limit, search, classId, sortBy, sortOrder })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((section) => ({
                type: "Sections" as const,
                id: section.id,
              })),
              { type: "Sections", id: "LIST" },
            ]
          : [{ type: "Sections", id: "LIST" }],
    }),
    getSection: builder.query<DashboardSection, number>({
      query: (id) => `/dashboard/sections/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Sections", id }],
    }),
    getYears: builder.query<DashboardYear[], void>({
      query: () => "/dashboard/years",
      providesTags: [{ type: "Sections", id: "YEARS" }],
    }),
    getSectionTitles: builder.query<DashboardSectionTitle[], void>({
      query: () => "/dashboard/section-titles",
      providesTags: (result) =>
        result
          ? [
              ...result.map((title) => ({
                type: "Sections" as const,
                id: `title-${title.id}`,
              })),
              { type: "Sections", id: "TITLES" },
            ]
          : [{ type: "Sections", id: "TITLES" }],
    }),
    getSectionTitle: builder.query<DashboardSectionTitle, number>({
      query: (id) => `/dashboard/section-titles/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "Sections", id: `title-${id}` },
      ],
    }),
    createSectionTitle: builder.mutation<DashboardSectionTitle, SaveSectionTitleBody>({
      query: (body) => ({
        url: "/dashboard/section-titles",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Sections", id: "TITLES" }],
    }),
    updateSectionTitle: builder.mutation<
      DashboardSectionTitle,
      { id: number; body: SaveSectionTitleBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/section-titles/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Sections", id: `title-${id}` },
        { type: "Sections", id: "TITLES" },
        { type: "Sections", id: "LIST" },
      ],
    }),
    deleteSectionTitle: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/section-titles/${id}`,
        method: "DELETE",
        responseHandler: async (response) => {
          await response.text();
          return undefined;
        },
      }),
      invalidatesTags: [{ type: "Sections", id: "TITLES" }],
    }),
    createSection: builder.mutation<DashboardSection, SaveSectionBody>({
      query: (body) => ({
        url: "/dashboard/sections",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Sections", id: "LIST" },
        { type: "Sections", id: "TITLES" },
        { type: "Classes", id: "LIST" },
      ],
    }),
    updateSection: builder.mutation<
      DashboardSection,
      { id: number; body: SaveSectionBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/sections/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Sections", id },
        { type: "Sections", id: "LIST" },
        { type: "Sections", id: "TITLES" },
        { type: "Classes", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetSectionsQuery,
  useGetSectionQuery,
  useGetYearsQuery,
  useGetSectionTitlesQuery,
  useGetSectionTitleQuery,
  useCreateSectionTitleMutation,
  useUpdateSectionTitleMutation,
  useDeleteSectionTitleMutation,
  useCreateSectionMutation,
  useUpdateSectionMutation,
} = sectionsApi;
