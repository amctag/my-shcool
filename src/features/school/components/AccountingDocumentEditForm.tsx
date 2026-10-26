"use client";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import {
  useGetDashboardPaymentQuery,
  useGetDashboardReceiptQuery,
  useGetDashboardInvoiceQuery,
  useGetDashboardRecordQuery,
} from "@/features/school/api/accountingApi";
import { PaymentForm } from "./PaymentForm";
import { ReceiptForm } from "./ReceiptForm";
import { InvoiceForm } from "./InvoiceForm";
import { RecordForm } from "./RecordForm";

export function AccountingDocumentEditForm({
  kind,
  id,
}: {
  kind: "receipt" | "payment" | "invoice" | "record";
  id: number;
}) {
  const receipt = useGetDashboardReceiptQuery(id, { skip: kind !== "receipt" });
  const payment = useGetDashboardPaymentQuery(id, { skip: kind !== "payment" });
  const invoice = useGetDashboardInvoiceQuery(id, { skip: kind !== "invoice" });
  const record = useGetDashboardRecordQuery(id, { skip: kind !== "record" });
  const query = kind === "receipt" ? receipt : kind === "payment" ? payment : kind === "invoice" ? invoice : record;
  if (!query.data) return <LoadingDots label={`Loading ${kind}`} />;
  if (kind === "receipt") return <ReceiptForm key={receipt.data!.id} initial={receipt.data!} />;
  if (kind === "payment") return <PaymentForm key={payment.data!.id} initial={payment.data!} />;
  if (kind === "invoice") return <InvoiceForm key={invoice.data!.id} initial={invoice.data!} />;
  return <RecordForm key={record.data!.id} initial={record.data!} />;
}
