import { BackLink } from "@/components/dashboard/BackLink";
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
      <BackLink
        href="/students"
      >
        Back to students
      </BackLink>
      <StudentForm initialParentId={initialParentId} />
    </div>
  );
}
