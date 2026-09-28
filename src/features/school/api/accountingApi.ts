import { baseApi } from "@/store/api/baseApi";
import { toQueryString } from "@/lib/toQueryString";
import type {
  DashboardAccount,
  DashboardAccountingDocumentQuery,
  DashboardAccountsQuery,
  DashboardAccountsResponse,
  DashboardCurrency,
  DashboardInvoice,
  DashboardInvoicesQuery,
  DashboardInvoicesResponse,
  DashboardItem,
  DashboardItemsResponse,
  DashboardItemType,
  DashboardPackagePreview,
  DashboardParentRegistration,
  DashboardPayment,
  DashboardPaymentsResponse,
  DashboardReceipt,
  DashboardReceiptsResponse,
  DashboardRecord,
  DashboardRecordsResponse,
  DashboardRegistrationPackage,
  DashboardRegistrationPackagesResponse,
  DashboardRegistrationWithInvoice,
  DashboardStatement,
  DashboardStatementQuery,
  DashboardPackageClassOption,
  SaveAccountBody,
  SaveInvoiceBody,
  SavePaymentBody,
  SaveReceiptBody,
  SaveRecordBody,
  SaveDashboardItemBody,
  SaveDashboardRegistrationPackageBody,
  SaveRegistrationWithInvoiceBody,
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
    createDashboardAccount: builder.mutation<DashboardAccount, SaveAccountBody>(
      {
        query: (body) => ({
          url: "/dashboard/accounting/accounts",
          method: "POST",
          body,
        }),
        invalidatesTags: [{ type: "DashboardAccounting", id: "ACCOUNTS" }],
      },
    ),
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
      query: ({ page, limit, search, currencyId, dateFrom, dateTo }) =>
        `/dashboard/accounting/receipts${toQueryString({ page, limit, search, currencyId, dateFrom, dateTo })}`,
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
    createDashboardReceipt: builder.mutation<DashboardReceipt, SaveReceiptBody>(
      {
        query: (body) => ({
          url: "/dashboard/accounting/receipts",
          method: "POST",
          body,
        }),
        invalidatesTags: [{ type: "DashboardAccounting", id: "RECEIPTS" }],
      },
    ),
    updateDashboardReceipt: builder.mutation<
      DashboardReceipt,
      { id: number; body: SaveReceiptBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/accounting/receipts/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "DashboardAccounting", id: "RECEIPTS" },
        { type: "DashboardAccounting", id: `receipt-${id}` },
      ],
    }),
    getDashboardReceipt: builder.query<DashboardReceipt, number>({
      query: (id) => `/dashboard/accounting/receipts/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "DashboardAccounting", id: `receipt-${id}` },
      ],
    }),
    getDashboardPayments: builder.query<
      DashboardPaymentsResponse,
      DashboardAccountingDocumentQuery
    >({
      query: ({ page, limit, search, currencyId, dateFrom, dateTo }) =>
        `/dashboard/accounting/payments${toQueryString({ page, limit, search, currencyId, dateFrom, dateTo })}`,
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
    createDashboardPayment: builder.mutation<DashboardPayment, SavePaymentBody>(
      {
        query: (body) => ({
          url: "/dashboard/accounting/payments",
          method: "POST",
          body,
        }),
        invalidatesTags: [
          { type: "DashboardAccounting", id: "PAYMENTS" },
          { type: "DashboardAccounting", id: "RECEIPTS" },
        ],
      },
    ),
    updateDashboardPayment: builder.mutation<
      DashboardPayment,
      { id: number; body: SavePaymentBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/accounting/payments/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "DashboardAccounting", id: "PAYMENTS" },
        { type: "DashboardAccounting", id: `payment-${id}` },
      ],
    }),
    getDashboardPayment: builder.query<DashboardPayment, number>({
      query: (id) => `/dashboard/accounting/payments/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "DashboardAccounting", id: `payment-${id}` },
      ],
    }),
    getDashboardInvoices: builder.query<
      DashboardInvoicesResponse,
      DashboardInvoicesQuery
    >({
      query: ({ page, limit, search, currencyId, dateFrom, dateTo, parentId }) =>
        `/dashboard/accounting/invoices${toQueryString({ page, limit, search, currencyId, dateFrom, dateTo, parentId })}`,
      keepUnusedDataFor: 60,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "DashboardAccounting" as const,
                id: `invoice-${item.id}`,
              })),
              { type: "DashboardAccounting", id: "INVOICES" },
            ]
          : [{ type: "DashboardAccounting", id: "INVOICES" }],
    }),
    createDashboardInvoice: builder.mutation<DashboardInvoice, SaveInvoiceBody>(
      {
        query: (body) => ({
          url: "/dashboard/accounting/invoices",
          method: "POST",
          body,
        }),
        invalidatesTags: [{ type: "DashboardAccounting", id: "INVOICES" }],
      },
    ),
    getDashboardInvoice: builder.query<DashboardInvoice, number>({
      query: (id) => `/dashboard/accounting/invoices/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "DashboardAccounting", id: `invoice-${id}` },
      ],
    }),
    getDashboardParentRegistrations: builder.query<
      DashboardParentRegistration[],
      number
    >({
      query: (parentId) =>
        `/dashboard/accounting/invoices/parent-registrations${toQueryString({ parentId })}`,
    }),
    getDashboardPackagePreview: builder.query<
      DashboardPackagePreview,
      { classId: number; yearId: number; studentId?: number }
    >({
      query: ({ classId, yearId, studentId }) =>
        `/dashboard/accounting/registration-packages/by-class/preview${toQueryString({ classId, yearId, studentId })}`,
    }),
    createRegistrationWithInvoice: builder.mutation<
      DashboardRegistrationWithInvoice,
      SaveRegistrationWithInvoiceBody
    >({
      query: (body) => ({
        url: "/dashboard/accounting/registrations/with-invoice",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "DashboardAccounting", id: "INVOICES" },
        { type: "Registrations", id: "LIST" },
        { type: "Child", id: "LIST" },
      ],
    }),
    getDashboardRecords: builder.query<
      DashboardRecordsResponse,
      DashboardAccountingDocumentQuery
    >({
      query: ({ page, limit, search, currencyId, dateFrom, dateTo }) =>
        `/dashboard/accounting/records${toQueryString({ page, limit, search, currencyId, dateFrom, dateTo })}`,
      keepUnusedDataFor: 60,
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((item) => ({
                type: "DashboardAccounting" as const,
                id: `record-${item.id}`,
              })),
              { type: "DashboardAccounting", id: "RECORDS" },
            ]
          : [{ type: "DashboardAccounting", id: "RECORDS" }],
    }),
    createDashboardRecord: builder.mutation<DashboardRecord, SaveRecordBody>({
      query: (body) => ({
        url: "/dashboard/accounting/records",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DashboardAccounting", id: "RECORDS" }],
    }),
    getDashboardRecord: builder.query<DashboardRecord, number>({
      query: (id) => `/dashboard/accounting/records/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "DashboardAccounting", id: `record-${id}` },
      ],
    }),
    getDashboardStatement: builder.query<
      DashboardStatement,
      DashboardStatementQuery
    >({
      query: ({ accountId, dateFrom, dateTo, documentType, search, page, limit }) =>
        `/dashboard/accounting/accounts/${accountId}/statement${toQueryString({ dateFrom, dateTo, documentType, search, page, limit })}`,
      keepUnusedDataFor: 60,
    }),
    getDashboardItemTypes: builder.query<DashboardItemType[], void>({
      query: () => "/dashboard/accounting/item-types",
    }),
    getDashboardItems: builder.query<
      DashboardItemsResponse,
      { page: number; limit: number; search?: string; itemTypeId?: number }
    >({
      query: (query) => `/dashboard/accounting/items${toQueryString(query)}`,
      providesTags: [{ type: "DashboardAccounting", id: "ITEMS" }],
    }),
    getDashboardItem: builder.query<DashboardItem, number>({
      query: (id) => `/dashboard/accounting/items/${id}`,
    }),
    createDashboardItem: builder.mutation<DashboardItem, SaveDashboardItemBody>(
      {
        query: (body) => ({
          url: "/dashboard/accounting/items",
          method: "POST",
          body,
        }),
        invalidatesTags: [{ type: "DashboardAccounting", id: "ITEMS" }],
      },
    ),
    updateDashboardItem: builder.mutation<
      DashboardItem,
      { id: number; body: SaveDashboardItemBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/accounting/items/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "DashboardAccounting", id: "ITEMS" }],
    }),
    deleteDashboardItem: builder.mutation<{ deleted: boolean }, number>({
      query: (id) => ({
        url: `/dashboard/accounting/items/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "DashboardAccounting", id: "ITEMS" }],
    }),
    getDashboardRegistrationPackages: builder.query<
      DashboardRegistrationPackagesResponse,
      { page: number; limit: number; search?: string; yearId?: number }
    >({
      query: (query) =>
        `/dashboard/accounting/registration-packages${toQueryString(query)}`,
      providesTags: [{ type: "DashboardAccounting", id: "PACKAGES" }],
    }),
    getDashboardRegistrationPackage: builder.query<
      DashboardRegistrationPackage,
      number
    >({
      query: (id) => `/dashboard/accounting/registration-packages/${id}`,
      providesTags: (_r, _e, id) => [
        { type: "DashboardAccounting", id: `package-${id}` },
      ],
    }),
    getDashboardPackageClasses: builder.query<
      DashboardPackageClassOption[],
      number
    >({
      query: (yearId) =>
        `/dashboard/accounting/registration-packages/available-classes?yearId=${yearId}`,
    }),
    createDashboardRegistrationPackage: builder.mutation<
      DashboardRegistrationPackage,
      SaveDashboardRegistrationPackageBody
    >({
      query: (body) => ({
        url: "/dashboard/accounting/registration-packages",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "DashboardAccounting", id: "PACKAGES" }],
    }),
    updateDashboardRegistrationPackage: builder.mutation<
      DashboardRegistrationPackage,
      { id: number; body: SaveDashboardRegistrationPackageBody }
    >({
      query: ({ id, body }) => ({
        url: `/dashboard/accounting/registration-packages/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "DashboardAccounting", id: "PACKAGES" },
        { type: "DashboardAccounting", id: `package-${id}` },
      ],
    }),
    deleteDashboardRegistrationPackage: builder.mutation<
      { deleted: boolean },
      number
    >({
      query: (id) => ({
        url: `/dashboard/accounting/registration-packages/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "DashboardAccounting", id: "PACKAGES" }],
    }),
    addDashboardPackageItem: builder.mutation<
      unknown,
      {
        packageId: number;
        body: {
          itemId: number;
          price: number;
          mandatory: boolean;
          currencyId: number;
        };
      }
    >({
      query: ({ packageId, body }) => ({
        url: `/dashboard/accounting/registration-packages/${packageId}/items`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { packageId }) => [
        { type: "DashboardAccounting", id: `package-${packageId}` },
      ],
    }),
    removeDashboardPackageItem: builder.mutation<
      unknown,
      { packageId: number; relationId: number }
    >({
      query: ({ packageId, relationId }) => ({
        url: `/dashboard/accounting/registration-packages/${packageId}/items/${relationId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { packageId }) => [
        { type: "DashboardAccounting", id: `package-${packageId}` },
      ],
    }),
    assignDashboardPackageClasses: builder.mutation<
      unknown,
      { packageId: number; classIds: number[] }
    >({
      query: ({ packageId, classIds }) => ({
        url: `/dashboard/accounting/registration-packages/${packageId}/classes`,
        method: "POST",
        body: { classIds },
      }),
      invalidatesTags: (_r, _e, { packageId }) => [
        { type: "DashboardAccounting", id: `package-${packageId}` },
      ],
    }),
    removeDashboardPackageClass: builder.mutation<
      unknown,
      { packageId: number; relationId: number }
    >({
      query: ({ packageId, relationId }) => ({
        url: `/dashboard/accounting/registration-packages/${packageId}/classes/${relationId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { packageId }) => [
        { type: "DashboardAccounting", id: `package-${packageId}` },
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
  useUpdateDashboardReceiptMutation,
  useGetDashboardReceiptQuery,
  useGetDashboardPaymentsQuery,
  useCreateDashboardPaymentMutation,
  useUpdateDashboardPaymentMutation,
  useGetDashboardPaymentQuery,
  useGetDashboardInvoicesQuery,
  useCreateDashboardInvoiceMutation,
  useGetDashboardInvoiceQuery,
  useGetDashboardParentRegistrationsQuery,
  useGetDashboardPackagePreviewQuery,
  useCreateRegistrationWithInvoiceMutation,
  useGetDashboardRecordsQuery,
  useCreateDashboardRecordMutation,
  useGetDashboardRecordQuery,
  useGetDashboardStatementQuery,
  useGetDashboardItemTypesQuery,
  useGetDashboardItemsQuery,
  useGetDashboardItemQuery,
  useCreateDashboardItemMutation,
  useUpdateDashboardItemMutation,
  useDeleteDashboardItemMutation,
  useGetDashboardRegistrationPackagesQuery,
  useGetDashboardRegistrationPackageQuery,
  useGetDashboardPackageClassesQuery,
  useCreateDashboardRegistrationPackageMutation,
  useUpdateDashboardRegistrationPackageMutation,
  useDeleteDashboardRegistrationPackageMutation,
  useAddDashboardPackageItemMutation,
  useRemoveDashboardPackageItemMutation,
  useAssignDashboardPackageClassesMutation,
  useRemoveDashboardPackageClassMutation,
} = accountingApi;
