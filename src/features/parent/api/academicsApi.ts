import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  ParentExamScheduleDetail,
  ParentExamSchedulesResponse,
  ParentGradesQuery,
  ParentGradesResponse,
  ParentWeeklyScheduleResponse,
  StudentFilterQuery,
} from "@/features/parent/types";

export const parentAcademicsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWeeklySchedule: builder.query<
      ParentWeeklyScheduleResponse,
      StudentFilterQuery | void
    >({
      query: (params) =>
        `/parent/me/weekly-schedule${toQueryString(params ?? {})}`,
      providesTags: ["Schedule"],
    }),
    getGrades: builder.query<ParentGradesResponse, ParentGradesQuery | void>({
      query: (params) => `/parent/me/grades${toQueryString(params ?? {})}`,
      providesTags: ["Grade"],
    }),
    getExamSchedules: builder.query<
      ParentExamSchedulesResponse,
      StudentFilterQuery | void
    >({
      query: (params) =>
        `/parent/me/exam-schedules${toQueryString(params ?? {})}`,
      providesTags: ["ExamSchedule"],
    }),
    getExamSchedule: builder.query<
      ParentExamScheduleDetail,
      { scheduleId: number; studentId?: number }
    >({
      query: ({ scheduleId, studentId }) =>
        `/parent/me/exam-schedules/${scheduleId}${toQueryString({ studentId })}`,
      providesTags: (_result, _error, { scheduleId }) => [
        { type: "ExamSchedule", id: scheduleId },
      ],
    }),
  }),
});

export const {
  useGetWeeklyScheduleQuery,
  useGetGradesQuery,
  useGetExamSchedulesQuery,
  useGetExamScheduleQuery,
} = parentAcademicsApi;
