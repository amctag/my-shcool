import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  ParentActivitiesResponse,
  ParentAnnouncementsResponse,
  ParentNoticesQuery,
  ParentNoticesResponse,
  StudentFilterQuery,
} from "@/features/parent/types";

export const parentCommunicationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnnouncements: builder.query<
      ParentAnnouncementsResponse,
      StudentFilterQuery | void
    >({
      query: (params) =>
        `/parent/me/announcements${toQueryString(params ?? {})}`,
      providesTags: ["Announcement"],
    }),
    getActivities: builder.query<
      ParentActivitiesResponse,
      StudentFilterQuery | void
    >({
      query: (params) => `/parent/me/activities${toQueryString(params ?? {})}`,
      providesTags: ["Activity"],
    }),
    getNotices: builder.query<ParentNoticesResponse, ParentNoticesQuery | void>(
      {
        query: (params) => `/parent/me/notices${toQueryString(params ?? {})}`,
        providesTags: ["Notice"],
      },
    ),
  }),
});

export const {
  useGetAnnouncementsQuery,
  useGetActivitiesQuery,
  useGetNoticesQuery,
} = parentCommunicationApi;
