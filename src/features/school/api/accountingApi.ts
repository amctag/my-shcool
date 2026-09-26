import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardAccount,
  DashboardAccountingDocumentQuery,
  DashboardPayment,
  DashboardPaymentsResponse,
  DashboardReceipt,
  DashboardReceiptsResponse,
  SavePaymentBody,
  SaveReceiptBody,
} from "@/features/school/types";

export const accountingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardAccounts: builder.query<DashboardAccount[], void>({
      query: () => "/dashboard/accounting/accounts",
      providesTags: [{ type: "DashboardAccounting", id: "ACCOUNTS" }],
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
  useGetDashboardAccountsQuery,
  useSetupDashboardSystemAccountsMutation,
  useGetDashboardReceiptsQuery,
  useCreateDashboardReceiptMutation,
  useGetDashboardPaymentsQuery,
  useCreateDashboardPaymentMutation,
} = accountingApi;
