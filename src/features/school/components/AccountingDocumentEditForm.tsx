"use client";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import {
  useGetDashboardPaymentQuery,
  useGetDashboardReceiptQuery,
} from "@/features/school/api/accountingApi";
import { PaymentForm } from "./PaymentForm";
import { ReceiptForm } from "./ReceiptForm";

export function AccountingDocumentEditForm({
  kind,
  id,
}: {
  kind: "receipt" | "payment";
  id: number;
}) {
  const receipt = useGetDashboardReceiptQuery(id, { skip: kind !== "receipt" });
  const payment = useGetDashboardPaymentQuery(id, { skip: kind !== "payment" });
  const query = kind === "receipt" ? receipt : payment;
  if (!query.data) return <LoadingDots label={`Loading ${kind}`} />;
  return kind === "receipt" ? (
    <ReceiptForm
      key={query.data.id}
      initial={query.data as typeof receipt.data}
    />
  ) : (
    <PaymentForm
      key={query.data.id}
      initial={query.data as typeof payment.data}
    />
  );
}
