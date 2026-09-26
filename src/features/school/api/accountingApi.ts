import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardAccount,
  DashboardAccountingDocumentQuery,
  DashboardAccountsQuery,
  DashboardAccountsResponse,
  DashboardCurrency,
  DashboardPayment,
  DashboardPaymentsResponse,
  DashboardReceipt,
  DashboardReceiptsResponse,
  SaveAccountBody,
  SavePaymentBody,
  SaveReceiptBody,
  UpdateAccountBody,
} from "@/features/school/types";

export const accountingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardCurrencies: builder.query<DashboardCurrency[], void>({
      query: () => "/dashboard/accounting/currencies",
      providesTags: [{ type: "DashboardAccounting", id: "CURRENCIES" }],
    }),
    getDashboardAccounts: builder.query<DashboardAccount[], void>({
      query: () => "/dashboard/accounting/accounts?limit=500",
      transformResponse: (response: DashboardAccountsResponse) =>
        response.items,
      providesTags: [{ type: "DashboardAccounting", id: "ACCOUNTS" }],
    }),
    getDashboardAccountsPage: builder.query<
      DashboardAccountsResponse,
      DashboardAccountsQuery
    >({
      query: ({ page, limit, search, type }) =>
        `/dashboard/accounting/accounts${toQueryString({
          page,
          limit,
          search,
          type: type === "ALL" ? undefined : type,
        })}`,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "DashboardAccounting" as const,
                id: `account-${item.id}`,
              })),
              { type: "DashboardAccounting", id: "ACCOUNTS" },
            ]
          : [{ type: "DashboardAccounting", id: "ACCOUNTS" }],
    }),
    getDashboardAccount: builder.query<DashboardAccount, number>({
      query: (id) => `/dashboard/accounting/accounts/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "DashboardAccounting", id: `account-${id}` },
      ],
    }),
    createDashboardAccount: builder.mutation<DashboardAccount, SaveAccountBody>({
      query: (body) => ({
        url: "/dashboard/accounting/accounts",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DashboardAccounting", id: "ACCOUNTS" }],
    }),
    updateDashboardAccount: builder.mutation<
      DashboardAccount,
      { id: number; body: UpdateAccountBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/accounting/accounts/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "DashboardAccounting", id: "ACCOUNTS" },
        { type: "DashboardAccounting", id: `account-${id}` },
      ],
    }),
    setupDashboardSystemAccounts: builder.mutation<DashboardAccount[], void>({
      query: () => ({
        url: "/dashboard/accounting/system-accounts/setup",
        method: "POST",
      }),
      invalidatesTags: [{ type: "DashboardAccounting", id: "ACCOUNTS" }],
    }),
    getDashboardReceipts: builder.query<
      DashboardReceiptsResponse,
      DashboardAccountingDocumentQuery
    >({
      query: ({ page, limit }) =>
        `/dashboard/accounting/receipts${toQueryString({ page, limit })}`,
      keepUnusedDataFor: 60,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "DashboardAccounting" as const,
                id: `receipt-${item.id}`,
              })),
              { type: "DashboardAccounting", id: "RECEIPTS" },
            ]
          : [{ type: "DashboardAccounting", id: "RECEIPTS" }],
    }),
    createDashboardReceipt: builder.mutation<DashboardReceipt, SaveReceiptBody>({
      query: (body) => ({
        url: "/dashboard/accounting/receipts",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DashboardAccounting", id: "RECEIPTS" }],
    }),
    getDashboardPayments: builder.query<
      DashboardPaymentsResponse,
      DashboardAccountingDocumentQuery
    >({
      query: ({ page, limit }) =>
        `/dashboard/accounting/payments${toQueryString({ page, limit })}`,
      keepUnusedDataFor: 60,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "DashboardAccounting" as const,
                id: `payment-${item.id}`,
              })),
              { type: "DashboardAccounting", id: "PAYMENTS" },
            ]
          : [{ type: "DashboardAccounting", id: "PAYMENTS" }],
    }),
    createDashboardPayment: builder.mutation<DashboardPayment, SavePaymentBody>({
      query: (body) => ({
        url: "/dashboard/accounting/payments",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "DashboardAccounting", id: "PAYMENTS" },
        { type: "DashboardAccounting", id: "RECEIPTS" },
      ],
    }),
  }),
});

export const {
  useGetDashboardCurrenciesQuery,
  useGetDashboardAccountsQuery,
  useGetDashboardAccountsPageQuery,
  useGetDashboardAccountQuery,
  useCreateDashboardAccountMutation,
  useUpdateDashboardAccountMutation,
  useSetupDashboardSystemAccountsMutation,
  useGetDashboardReceiptsQuery,
  useCreateDashboardReceiptMutation,
  useGetDashboardPaymentsQuery,
  useCreateDashboardPaymentMutation,
} = accountingApi;
