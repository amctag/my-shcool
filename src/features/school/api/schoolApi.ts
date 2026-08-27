import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type { SchoolDetails } from "@/features/parent/types";

export const schoolApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSchoolDetails: builder.query<SchoolDetails, { schoolId: number }>({
      query: (params) => `/school/details${toQueryString(params)}`,
      providesTags: (_result, _error, { schoolId }) => [
        { type: "School", id: schoolId },
      ],
    }),
  }),
});

export const { useGetSchoolDetailsQuery } = schoolApi;
