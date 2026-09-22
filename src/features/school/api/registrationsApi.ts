import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  BulkProgressRegistrationBody,
  BulkProgressRegistrationsResponse,
  DashboardRegistration,
  DashboardRegistrationsQuery,
  DashboardRegistrationsResponse,
  ProgressRegistrationBody,
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
        firstName,
        middleName,
        lastName,
        classId,
        sectionId,
        yearId,
        studentId,
        sortBy,
        sortOrder,
      }) =>
        `/dashboard/registrations${toQueryString({
          page,
          limit,
          search,
          firstName,
          middleName,
          lastName,
          classId,
          sectionId,
          yearId,
          studentId,
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
    updateRegistration: builder.mutation<
      DashboardRegistration,
      { id: number; body: SaveRegistrationBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/registrations/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Registrations", id },
        { type: "Registrations", id: "LIST" },
        { type: "Child", id: "LIST" },
      ],
    }),
    progressRegistration: builder.mutation<
      DashboardRegistration,
      { id: number; body: ProgressRegistrationBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/registrations/${id}/progress`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Registrations", id: "LIST" },
        { type: "Child", id: "LIST" },
      ],
    }),
    bulkProgressRegistrations: builder.mutation<
      BulkProgressRegistrationsResponse,
      BulkProgressRegistrationBody
    >({
      query: (body) => ({
        url: "/dashboard/registrations/progress",
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
  useLazyGetRegistrationsQuery,
  useGetRegistrationQuery,
  useCreateRegistrationMutation,
  useUpdateRegistrationMutation,
  useProgressRegistrationMutation,
  useBulkProgressRegistrationsMutation,
  useDeleteRegistrationMutation,
} = registrationsApi;
