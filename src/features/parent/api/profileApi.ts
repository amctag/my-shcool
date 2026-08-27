import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  ChangePasswordRequest,
  ChangePasswordRequestOtpResponse,
  ParentChildDetail,
  ParentChildrenSummaryResponse,
  ParentProfile,
  ParentSchoolDetailsResponse,
  StudentFilterQuery,
} from "@/features/parent/types";
import type { MessageResponse } from "@/features/auth/types";

export const parentProfileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getParentMe: builder.query<ParentProfile, void>({
      query: () => "/parent/me",
      providesTags: ["Parent"],
    }),
    getParentChildren: builder.query<ParentChildrenSummaryResponse, void>({
      query: () => "/parent/me/children",
      providesTags: ["Child"],
    }),
    getParentChild: builder.query<ParentChildDetail, number>({
      query: (studentId) => `/parent/me/children/${studentId}`,
      providesTags: (_result, _error, studentId) => [
        { type: "Child", id: studentId },
      ],
    }),
    getParentSchoolDetails: builder.query<
      ParentSchoolDetailsResponse,
      StudentFilterQuery | void
    >({
      query: (params) =>
        `/parent/me/school-details${toQueryString(params ?? {})}`,
      providesTags: ["School"],
    }),
    requestChangePasswordOtp: builder.mutation<
      ChangePasswordRequestOtpResponse,
      void
    >({
      query: () => ({
        url: "/parent/me/change-password/request-otp",
        method: "POST",
      }),
    }),
    changePassword: builder.mutation<MessageResponse, ChangePasswordRequest>({
      query: (body) => ({
        url: "/parent/me/change-password",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useGetParentMeQuery,
  useGetParentChildrenQuery,
  useGetParentChildQuery,
  useGetParentSchoolDetailsQuery,
  useRequestChangePasswordOtpMutation,
  useChangePasswordMutation,
} = parentProfileApi;
