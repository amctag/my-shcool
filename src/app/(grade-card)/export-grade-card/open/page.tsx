import { OpenGradeView } from "@/features/school/components/OpenGradeTable";

export default async function OpenGradePage({
  searchParams,
}: {
  searchParams: Promise<{
    registrationId?: string;
    yearId?: string;
    classId?: string;
    sectionId?: string;
  }>;
}) {
  const params = await searchParams;
  const registrationId = Number(params.registrationId);
  const yearId = Number(params.yearId);
  const classId = Number(params.classId);
  const sectionId = Number(params.sectionId);

  const valid =
    Number.isInteger(registrationId) &&
    registrationId > 0 &&
    Number.isInteger(yearId) &&
    yearId > 0 &&
    Number.isInteger(classId) &&
    classId > 0 &&
    Number.isInteger(sectionId) &&
    sectionId > 0;

  if (!valid) {
    return (
      <div className="grade-card-page">
        <p className="grade-card-loading text-red-600">
          Missing or invalid grade card parameters.
        </p>
      </div>
    );
  }

  return (
    <OpenGradeView
      registrationId={registrationId}
      yearId={yearId}
      classId={classId}
      sectionId={sectionId}
      standalone
    />
  );
}
