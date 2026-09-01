import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardRegistration,
  DashboardRegistrationsQuery,
  DashboardRegistrationsResponse,
  SaveRegistrationBody,
} from "@/features/school/types";

export const registrationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRegistrations: builder.query<
      DashboardRegistrationsResponse,
      DashboardRegistrationsQuery
    >({
      query: ({
        page,
        limit,
        search,
        classId,
        sectionId,
        yearId,
        sortBy,
        sortOrder,
      }) =>
        `/dashboard/registrations${toQueryString({
          page,
          limit,
          search,
          classId,
          sectionId,
          yearId,
          sortBy,
          sortOrder,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "Registrations" as const,
                id: item.id,
              })),
              { type: "Registrations", id: "LIST" },
            ]
          : [{ type: "Registrations", id: "LIST" }],
    }),
    getRegistration: builder.query<DashboardRegistration, number>({
      query: (id) => `/dashboard/registrations/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Registrations", id }],
    }),
    createRegistration: builder.mutation<
      DashboardRegistration,
      SaveRegistrationBody
    >({
      query: (body) => ({
        url: "/dashboard/registrations",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Registrations", id: "LIST" },
        { type: "Child", id: "LIST" },
      ],
    }),
    deleteRegistration: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/registrations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Registrations", id },
        { type: "Registrations", id: "LIST" },
        { type: "Child", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetRegistrationsQuery,
  useGetRegistrationQuery,
  useCreateRegistrationMutation,
  useDeleteRegistrationMutation,
} = registrationsApi;
