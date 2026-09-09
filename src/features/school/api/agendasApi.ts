import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardAgenda,
  DashboardAgendasQuery,
  DashboardAgendasResponse,
  SaveAgendaBody,
} from "@/features/school/types";

export const agendasApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getDashboardAgendas: builder.query<
      DashboardAgendasResponse,
      DashboardAgendasQuery
    >({
      query: ({
        page,
        limit,
        yearId,
        classId,
        sectionId,
        courseId,
        agendaDate,
        status,
        search,
        sortBy,
        sortOrder,
      }) =>
        `/dashboard/agendas${toQueryString({
          page,
          limit,
          yearId,
          classId,
          sectionId,
          courseId,
          agendaDate,
          status,
          search,
          sortBy,
          sortOrder,
        })}`,
      keepUnusedDataFor: 60,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "DashboardAgendas" as const,
                id: item.id,
              })),
              { type: "DashboardAgendas", id: "LIST" },
            ]
          : [{ type: "DashboardAgendas", id: "LIST" }],
    }),
    getDashboardAgenda: builder.query<DashboardAgenda, number>({
      query: (id) => `/dashboard/agendas/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (_result, _error, id) => [
        { type: "DashboardAgendas", id },
      ],
    }),
    createDashboardAgenda: builder.mutation<DashboardAgenda, SaveAgendaBody>({
      query: (body) => ({
        url: "/dashboard/agendas",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "DashboardAgendas", id: "LIST" },
        { type: "DashboardAgendaSections", id: "LIST" },
      ],
    }),
    updateDashboardAgenda: builder.mutation<
      DashboardAgenda,
      { id: number; body: SaveAgendaBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/agendas/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "DashboardAgendas", id },
        { type: "DashboardAgendas", id: "LIST" },
        { type: "DashboardAgendaSections", id: "LIST" },
      ],
    }),
    deleteDashboardAgenda: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/agendas/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "DashboardAgendas", id },
        { type: "DashboardAgendas", id: "LIST" },
        { type: "DashboardAgendaSections", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetDashboardAgendasQuery,
  useGetDashboardAgendaQuery,
  useCreateDashboardAgendaMutation,
  useUpdateDashboardAgendaMutation,
  useDeleteDashboardAgendaMutation,
} = agendasApi;
