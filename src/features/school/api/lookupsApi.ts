import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type { LookupItem, RegionItem } from "@/features/school/types";

export const lookupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNationalities: builder.query<LookupItem[], void>({
      query: () => "/dashboard/lookups/nationalities",
      providesTags: [{ type: "Lookups", id: "nationalities" }],
    }),
    createNationality: builder.mutation<LookupItem, { name: string }>({
      query: (body) => ({
        url: "/dashboard/lookups/nationalities",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Lookups", id: "nationalities" }],
    }),
    getJobs: builder.query<LookupItem[], void>({
      query: () => "/dashboard/lookups/jobs",
      providesTags: [{ type: "Lookups", id: "jobs" }],
    }),
    createJob: builder.mutation<LookupItem, { name: string }>({
      query: (body) => ({
        url: "/dashboard/lookups/jobs",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Lookups", id: "jobs" }],
    }),
    getBloodTypes: builder.query<LookupItem[], void>({
      query: () => "/dashboard/lookups/blood-types",
      providesTags: [{ type: "Lookups", id: "blood-types" }],
    }),
    getGovernorates: builder.query<LookupItem[], void>({
      query: () => "/dashboard/lookups/governorates",
      providesTags: [{ type: "Lookups", id: "governorates" }],
    }),
    createGovernorate: builder.mutation<LookupItem, { name: string }>({
      query: (body) => ({
        url: "/dashboard/lookups/governorates",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Lookups", id: "governorates" }],
    }),
    getRegions: builder.query<RegionItem[], { governorateId?: number } | void>({
      query: (arg) =>
        `/dashboard/lookups/regions${toQueryString({
          governorateId: arg && "governorateId" in arg ? arg.governorateId : undefined,
        })}`,
      providesTags: (_result, _error, arg) => [
        {
          type: "Lookups",
          id: `regions-${arg && "governorateId" in arg ? arg.governorateId : "all"}`,
        },
      ],
    }),
    createRegion: builder.mutation<
      RegionItem,
      { name: string; governorateId: number }
    >({
      query: (body) => ({
        url: "/dashboard/lookups/regions",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { governorateId }) => [
        { type: "Lookups", id: `regions-${governorateId}` },
        { type: "Lookups", id: "regions-all" },
      ],
    }),
  }),
});

export const {
  useGetNationalitiesQuery,
  useCreateNationalityMutation,
  useGetJobsQuery,
  useCreateJobMutation,
  useGetBloodTypesQuery,
  useGetGovernoratesQuery,
  useCreateGovernorateMutation,
  useGetRegionsQuery,
  useCreateRegionMutation,
} = lookupsApi;
