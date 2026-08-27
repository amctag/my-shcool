import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  ParentAgendasQuery,
  ParentAgendasResponse,
  ParentAlbumDetail,
  ParentAlbumsResponse,
  ParentAttendanceAbsencesQuery,
  ParentAttendanceAbsencesResponse,
  StudentFilterQuery,
} from "@/features/parent/types";

export const parentDailyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAttendanceAbsences: builder.query<
      ParentAttendanceAbsencesResponse,
      ParentAttendanceAbsencesQuery
    >({
      query: (params) =>
        `/parent/me/attendance/absences${toQueryString(params)}`,
      providesTags: ["Attendance"],
    }),
    getAgendas: builder.query<ParentAgendasResponse, ParentAgendasQuery>({
      query: (params) => `/parent/me/agendas${toQueryString(params)}`,
      providesTags: ["Agenda"],
    }),
    getAlbums: builder.query<ParentAlbumsResponse, StudentFilterQuery | void>({
      query: (params) => `/parent/me/albums${toQueryString(params ?? {})}`,
      providesTags: ["Album"],
    }),
    getAlbum: builder.query<
      ParentAlbumDetail,
      { albumId: number; studentId?: number }
    >({
      query: ({ albumId, studentId }) =>
        `/parent/me/albums/${albumId}${toQueryString({ studentId })}`,
      providesTags: (_result, _error, { albumId }) => [
        { type: "Album", id: albumId },
      ],
    }),
  }),
});

export const {
  useGetAttendanceAbsencesQuery,
  useGetAgendasQuery,
  useGetAlbumsQuery,
  useGetAlbumQuery,
} = parentDailyApi;
