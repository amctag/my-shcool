import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardTeacherDetail,
  DashboardTeachersQuery,
  DashboardTeachersResponse,
  SaveTeacherBody,
} from "@/features/school/types";

export const teachersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeachers: builder.query<DashboardTeachersResponse, DashboardTeachersQuery>({
      query: ({
        page,
        limit,
        search,
        name,
        firstName,
        middleName,
        lastName,
        id,
        status,
        sortBy,
        sortOrder,
      }) =>
        `/dashboard/teachers${toQueryString({
          page,
          limit,
          search,
          name,
          firstName,
          middleName,
          lastName,
          id,
          status,
          sortBy,
          sortOrder,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((teacher) => ({
                type: "Teachers" as const,
                id: teacher.id,
              })),
              { type: "Teachers", id: "LIST" },
            ]
          : [{ type: "Teachers", id: "LIST" }],
    }),
    getTeacher: builder.query<DashboardTeacherDetail, number>({
      query: (id) => `/dashboard/teachers/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Teachers", id }],
    }),
    createTeacher: builder.mutation<DashboardTeacherDetail, SaveTeacherBody>({
      query: (body) => ({
        url: "/dashboard/teachers",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Teachers", id: "LIST" }],
    }),
    updateTeacher: builder.mutation<
      DashboardTeacherDetail,
      { id: number; body: SaveTeacherBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/teachers/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Teachers", id },
        { type: "Teachers", id: "LIST" },
      ],
    }),
    updateTeacherStatus: builder.mutation<
      { id: number; status: boolean },
      { id: number; status: boolean }
    >({
      query: ({ id, status }) => ({
        url: `/dashboard/teachers/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Teachers", id },
        { type: "Teachers", id: "LIST" },
      ],
    }),
    resetTeacherPassword: builder.mutation<
      { id: number; reset: boolean },
      { id: number; body: { newPassword: string; confirmPassword: string } }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/teachers/${id}/password`,
        method: "PATCH",
        body,
      }),
    }),
    deleteTeacher: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/teachers/${id}`,
        method: "DELETE",
        responseHandler: async (response) => {
          await response.text();
          return undefined;
        },
      }),
      invalidatesTags: [{ type: "Teachers", id: "LIST" }],
    }),
  }),
});

export const {
  useGetTeachersQuery,
  useLazyGetTeachersQuery,
  useGetTeacherQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useUpdateTeacherStatusMutation,
  useResetTeacherPasswordMutation,
  useDeleteTeacherMutation,
} = teachersApi;
