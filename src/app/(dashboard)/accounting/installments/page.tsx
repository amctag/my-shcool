import { PageHeader } from "@/components/dashboard/PageHeader";
import { InstallmentsList } from "@/features/school/components/InstallmentsList";
import Link from "next/link";

export default function InstallmentsPage() {
  return <div><PageHeader title="Installments" description="Manage payment reminders and schedules" action={<Link href="/accounting/installments/add" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover">+ Add Installments</Link>} /><InstallmentsList /></div>;
}
