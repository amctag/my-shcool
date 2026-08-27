import Link from "next/link";
import { StudentForm } from "@/features/school/components/StudentForm";

export default async function AddStudentPage({
  searchParams,
}: {
  searchParams: Promise<{ parentId?: string }>;
}) {
  const { parentId } = await searchParams;
  const parsed = Number(parentId);
  const initialParentId =
    Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;

  return (
    <div className="space-y-4">
      <Link
        href="/students"
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to students
      </Link>
      <StudentForm initialParentId={initialParentId} />
    </div>
  );
}
