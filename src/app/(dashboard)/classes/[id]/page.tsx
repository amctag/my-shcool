import { ClassStudentsPage } from "@/features/school/components/ClassStudentsPage";

export default async function ClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classId = Number(id);

  if (!Number.isInteger(classId) || classId <= 0) {
    return <p className="text-sm text-red-600">Invalid class id.</p>;
  }

  return <ClassStudentsPage classId={classId} />;
}
