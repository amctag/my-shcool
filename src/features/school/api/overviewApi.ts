import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";

export type DashboardOverviewStats = {
  students: number;
  teachers: number;
  classes: number;
  absencesToday: number;
};

export type DashboardOverviewStudent = {
  studentId: number;
  name: string;
  className: string | null;
  sectionName: string | null;
  parentName: string | null;
};

export type DashboardOverviewAgenda = {
  id: number;
  title: string;
  description: string;
  time: string;
  courseTitle: string;
  sectionsLabel: string;
};

export type DashboardOverviewAnnouncement = {
  id: number;
  title: string | null;
  content: string;
  audienceLabel: string;
};

export type DashboardOverviewResponse = {
  schoolName: string;
  yearTitle: string | null;
  yearId: number | null;
  stats: DashboardOverviewStats;
  recentStudents: DashboardOverviewStudent[];
  todayAgendas: DashboardOverviewAgenda[];
  recentAnnouncements: DashboardOverviewAnnouncement[];
};

export const overviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardOverview: builder.query<
      DashboardOverviewResponse,
      { yearId?: number }
    >({
      query: ({ yearId }) =>
        `/dashboard/overview${toQueryString({ yearId })}`,
      keepUnusedDataFor: 60,
      providesTags: [{ type: "DashboardOverview", id: "SUMMARY" }],
    }),
  }),
});

export const { useGetDashboardOverviewQuery } = overviewApi;
