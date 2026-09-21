import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardTeacherSupervisor,
  DashboardTeacherSupervisorsQuery,
  DashboardTeacherSupervisorsResponse,
  SaveTeacherSupervisorBody,
} from "@/features/school/types";

export const teacherSupervisorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeacherSupervisors: builder.query<
      DashboardTeacherSupervisorsResponse,
      DashboardTeacherSupervisorsQuery
    >({
      query: ({
        page,
        limit,
        search,
        classId,
        teacherId,
        yearId,
        sortBy,
        sortOrder,
      }) =>
        `/dashboard/teacher-supervisors${toQueryString({
          page,
          limit,
          search,
          classId,
          teacherId,
          yearId,
          sortBy,
          sortOrder,
        })}`,
      keepUnusedDataFor: 120,
      providesTags: (result) =>
        result
          ? [
              ...result.items.flatMap((item) =>
                item.classes.map((cls) => ({
                  type: "TeacherSupervisors" as const,
                  id: cls.id,
                })),
              ),
              { type: "TeacherSupervisors", id: "LIST" },
            ]
          : [{ type: "TeacherSupervisors", id: "LIST" }],
    }),
    getTeacherSupervisor: builder.query<DashboardTeacherSupervisor, number>({
      query: (id) => `/dashboard/teacher-supervisors/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "TeacherSupervisors", id },
      ],
    }),
    createTeacherSupervisor: builder.mutation<
      { items: DashboardTeacherSupervisor[] },
      SaveTeacherSupervisorBody
    >({
      query: (body) => ({
        url: "/dashboard/teacher-supervisors",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "TeacherSupervisors", id: "LIST" }],
    }),
    updateTeacherSupervisor: builder.mutation<
      DashboardTeacherSupervisor,
      { id: number; body: SaveTeacherSupervisorBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/teacher-supervisors/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "TeacherSupervisors", id },
        { type: "TeacherSupervisors", id: "LIST" },
      ],
    }),
    deleteTeacherSupervisor: builder.mutation<void, number>({
      query: (id) => ({
        url: `/dashboard/teacher-supervisors/${id}`,
        method: "DELETE",
        responseHandler: async (response) => {
          await response.text();
          return undefined;
        },
      }),
      invalidatesTags: [{ type: "TeacherSupervisors", id: "LIST" }],
    }),
  }),
});

export const {
  useGetTeacherSupervisorsQuery,
  useGetTeacherSupervisorQuery,
  useCreateTeacherSupervisorMutation,
  useUpdateTeacherSupervisorMutation,
  useDeleteTeacherSupervisorMutation,
} = teacherSupervisorsApi;
