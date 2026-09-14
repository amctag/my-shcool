import { baseApi } from "@/store/api/baseApi";
import type {
  DashboardUploadKind,
  DashboardUploadResponse,
} from "@/features/school/types";

export const uploadsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    uploadDashboardMedia: builder.mutation<
      DashboardUploadResponse,
      { file: File; kind: DashboardUploadKind }
    >({
      query: ({ file, kind }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", kind);
        return {
          url: `/dashboard/uploads?kind=${kind}`,
          method: "POST",
          body: formData,
        };
      },
    }),
  }),
});

export const { useUploadDashboardMediaMutation } = uploadsApi;
