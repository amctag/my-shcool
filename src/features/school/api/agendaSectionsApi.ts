import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardAgendaSectionRow,
  DashboardAgendaSectionsQuery,
  DashboardAgendaSectionsResponse,
  SaveAgendaSectionBody,
} from "@/features/school/types";

export const agendaSectionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAgendaSections: builder.query<
      DashboardAgendaSectionsResponse,
      DashboardAgendaSectionsQuery
    >({
      query: ({
        page,
        limit,
        yearId,
        classId,
        sectionId,
        agendaId,
        search,
        sortBy,
        sortOrder,
      }) =>
        `/dashboard/agenda-sections${toQueryString({
          page,
          limit,
          yearId,
          classId,
          sectionId,
          agendaId,
          search,
          sortBy,
          sortOrder,
        })}`,
      keepUnusedDataFor: 60,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "DashboardAgendaSections" as const,
                id: item.id,
              })),
              { type: "DashboardAgendaSections", id: "LIST" },
            ]
          : [{ type: "DashboardAgendaSections", id: "LIST" }],
    }),
    getAgendaSection: builder.query<DashboardAgendaSectionRow, number>({
      query: (id) => `/dashboard/agenda-sections/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: "DashboardAgendaSections", id },
      ],
    }),
    createAgendaSection: builder.mutation<
      DashboardAgendaSectionRow,
      SaveAgendaSectionBody
    >({
      query: (body) => ({
        url: "/dashboard/agenda-sections",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "DashboardAgendaSections", id: "LIST" },
        { type: "DashboardAgendas", id: "LIST" },
      ],
    }),
    updateAgendaSection: builder.mutation<
      DashboardAgendaSectionRow,
      { id: number; body: SaveAgendaSectionBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/agenda-sections/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "DashboardAgendaSections", id },
        { type: "DashboardAgendaSections", id: "LIST" },
        { type: "DashboardAgendas", id: "LIST" },
      ],
    }),
    deleteAgendaSection: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/agenda-sections/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "DashboardAgendaSections", id },
        { type: "DashboardAgendaSections", id: "LIST" },
        { type: "DashboardAgendas", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAgendaSectionsQuery,
  useGetAgendaSectionQuery,
  useCreateAgendaSectionMutation,
  useUpdateAgendaSectionMutation,
  useDeleteAgendaSectionMutation,
} = agendaSectionsApi;
