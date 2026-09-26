import { baseApi } from "@/store/api/baseApi";

export type AttendanceMode = "school" | "teacher" | "teacher_course";

export type DashboardSchoolSettings = {
  schoolId: number;
  teachersSeeAllClassCourses: boolean;
  attendanceMode: AttendanceMode;
  teachersCanPublishAgenda: boolean;
  teachersCanPublishGrades: boolean;
};

export const schoolSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSchoolSettings: builder.query<DashboardSchoolSettings, void>({
      query: () => "/dashboard/settings",
      providesTags: [{ type: "DashboardSettings", id: "CURRENT" }],
    }),
    updateSchoolSettings: builder.mutation<
      DashboardSchoolSettings,
      Partial<
        Pick<
          DashboardSchoolSettings,
          | "teachersSeeAllClassCourses"
          | "attendanceMode"
          | "teachersCanPublishAgenda"
          | "teachersCanPublishGrades"
        >
      >
    >({
      query: (body) => ({
        url: "/dashboard/settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "DashboardSettings", id: "CURRENT" }],
    }),
  }),
});

export const {
  useGetSchoolSettingsQuery,
  useUpdateSchoolSettingsMutation,
} = schoolSettingsApi;
