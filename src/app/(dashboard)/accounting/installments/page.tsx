import { PageHeader } from "@/components/dashboard/PageHeader";
import { InstallmentsList } from "@/features/school/components/InstallmentsList";

export default function InstallmentsPage() {
  return <div><PageHeader title="Installments" description="Manage payment reminders and schedules" /><InstallmentsList /></div>;
}
