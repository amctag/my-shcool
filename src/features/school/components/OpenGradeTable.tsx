"use client";

import Link from "next/link";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import { useGetGradeCardQuery } from "@/features/school/api/gradesApi";
import {
  GRADE_FORM_TABLE_FORMAT,
  gradeCardCellKey,
  resolveGradeFormTableFormat,
  type DashboardGradeCardCell,
} from "@/features/school/types";
import { useAppSelector } from "@/store/hooks";
import "./grade-card-document.css";

type OpenGradeTableProps = {
  registrationId: number;
  yearId: number;
  classId: number;
  sectionId: number;
};

function formatIssueDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function formatCoefficient(value: number): string {
  return value.toFixed(2);
}

function formatScore(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) {
    return "";
  }
  return Number(score).toFixed(2);
}

function getCellValue(
  cells: Record<string, DashboardGradeCardCell>,
  courseId: number,
  gradeTypeId: number,
): string {
  const cell = cells[gradeCardCellKey(courseId, gradeTypeId)];
  return formatScore(cell?.score);
}

type GradeCardLabels = ReturnType<typeof gradeCardLabels>;

type GradeCardCourse = {
  classCourseId: number;
  courseId: number;
  courseTitle: string;
  coefficient: number;
};

type GradeCardGradeType = {
  detailId: number;
  gradeTypeId: number;
  gradeTypeTitle: string;
};

function GradeCardTableCourseOnTop({
  labels,
  courses,
  gradeTypes,
  cells,
  showYearlyAverage,
}: {
  labels: GradeCardLabels;
  courses: GradeCardCourse[];
  gradeTypes: GradeCardGradeType[];
  cells: Record<string, DashboardGradeCardCell>;
  showYearlyAverage: boolean;
}) {
  const columnCount = 1 + Math.max(courses.length, 1) + (showYearlyAverage ? 1 : 0);

  return (
    <>
      <thead>
        <tr>
          <th className="course-cell">{labels.gradeType}</th>
          {courses.length > 0 ? (
            courses.map((course) => (
              <th key={course.classCourseId} className="course-cell">
                {course.courseTitle}
              </th>
            ))
          ) : (
            <th>—</th>
          )}
          {showYearlyAverage ? (
            <th className="average-cell">{labels.yearlyAverage}</th>
          ) : null}
        </tr>
        <tr>
          <th className="max-mark-cell">{labels.maxMark}</th>
          {courses.length > 0 ? (
            courses.map((course) => (
              <th key={`max-${course.classCourseId}`} className="max-mark-cell">
                {formatCoefficient(course.coefficient)}
              </th>
            ))
          ) : (
            <th>—</th>
          )}
          {showYearlyAverage ? <th className="average-cell">—</th> : null}
        </tr>
      </thead>
      <tbody>
        {gradeTypes.length === 0 ? (
          <tr>
            <td colSpan={columnCount} style={{ padding: "2rem" }}>
              {labels.noDetails}
            </td>
          </tr>
        ) : courses.length === 0 ? (
          <tr>
            <td colSpan={columnCount} style={{ padding: "2rem" }}>
              {labels.noCourses}
            </td>
          </tr>
        ) : (
          gradeTypes.map((gradeType) => (
            <tr key={gradeType.detailId}>
              <td className="course-cell">{gradeType.gradeTypeTitle}</td>
              {courses.map((course) => (
                <td
                  key={`${gradeType.detailId}-${course.classCourseId}`}
                  className="grade-cell"
                >
                  {getCellValue(cells, course.courseId, gradeType.gradeTypeId)}
                </td>
              ))}
              {showYearlyAverage ? (
                <td className="average-cell grade-cell">{labels.emptyGrade}</td>
              ) : null}
            </tr>
          ))
        )}
      </tbody>
    </>
  );
}

function GradeCardTableGradeOnTop({
  labels,
  courses,
  gradeTypes,
  cells,
  showYearlyAverage,
}: {
  labels: GradeCardLabels;
  courses: GradeCardCourse[];
  gradeTypes: GradeCardGradeType[];
  cells: Record<string, DashboardGradeCardCell>;
  showYearlyAverage: boolean;
}) {
  const columnCount =
    2 + Math.max(gradeTypes.length, 1) + (showYearlyAverage ? 1 : 0);

  return (
    <>
      <thead>
        <tr>
          <th className="course-cell">{labels.course}</th>
          <th className="max-mark-cell">{labels.maxMark}</th>
          {gradeTypes.length > 0 ? (
            gradeTypes.map((gradeType) => (
              <th key={gradeType.detailId}>{gradeType.gradeTypeTitle}</th>
            ))
          ) : (
            <th>—</th>
          )}
          {showYearlyAverage ? (
            <th className="average-cell">{labels.yearlyAverage}</th>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {courses.length === 0 ? (
          <tr>
            <td colSpan={columnCount} style={{ padding: "2rem" }}>
              {labels.noCourses}
            </td>
          </tr>
        ) : (
          courses.map((course) => (
            <tr key={course.classCourseId}>
              <td className="course-cell">{course.courseTitle}</td>
              <td className="max-mark-cell">
                {formatCoefficient(course.coefficient)}
              </td>
              {gradeTypes.length > 0 ? (
                gradeTypes.map((gradeType) => (
                  <td
                    key={`${course.classCourseId}-${gradeType.detailId}`}
                    className="grade-cell"
                  >
                    {getCellValue(
                      cells,
                      course.courseId,
                      gradeType.gradeTypeId,
                    )}
                  </td>
                ))
              ) : (
                <td className="grade-cell">{labels.emptyGrade}</td>
              )}
              {showYearlyAverage ? (
                <td className="average-cell grade-cell">
                  {labels.emptyGrade}
                </td>
              ) : null}
            </tr>
          ))
        )}
      </tbody>
    </>
  );
}

function gradeCardLabels(isRtl: boolean) {
  if (isRtl) {
    return {
      studentName: "اسم التلميذ",
      classSection: "الصف والشعبة",
      academicYear: "العام الدراسي",
      issueDate: "تاريخ الإصدار",
      course: "المادة",
      gradeType: "نوع العلامة",
      maxMark: "العلامة القصوى",
      yearlyAverage: "نتيجة معدل السنة الدراسية",
      emptyGrade: "",
      noForm: "لا يوجد نموذج علامات مرتبط بهذا الصف للعام المحدد.",
      noCourses: "لا توجد مواد لهذا الصف.",
      noDetails: "لا توجد تفاصيل ظاهرة في نموذج العلامات.",
    };
  }

  return {
    studentName: "Student name",
    classSection: "Class & section",
    academicYear: "Academic year",
    issueDate: "Issue date",
    course: "Course",
    gradeType: "Grade type",
    maxMark: "Max mark",
    yearlyAverage: "Yearly average",
    emptyGrade: "",
    noForm: "No grade form is assigned to this class for the selected year.",
    noCourses: "No courses found for this class.",
    noDetails: "This grade form has no visible details yet.",
  };
}

export function OpenGradeTable({
  registrationId,
  yearId,
  classId,
  sectionId,
}: OpenGradeTableProps) {
  const authReady = useAppSelector(selectAuthReady);
  const issueDate = formatIssueDate(new Date());

  const { data, error, isLoading } = useGetGradeCardQuery(
    { registrationId, yearId, classId, sectionId },
    { skip: !authReady || registrationId <= 0 },
  );

  if (isLoading) {
    return (
      <div className="grade-card-page">
        <div className="grade-card-loading">
          <LoadingDots label="Loading grade card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grade-card-page">
        <p className="grade-card-loading text-red-600" role="alert">
          {getApiErrorMessage(error, "Could not load grade card")}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grade-card-page">
        <p className="grade-card-loading text-red-600" role="alert">
          Grade card not found.
        </p>
      </div>
    );
  }

  const { student, gradeForm, courses, gradeTypes } = data;
  const cells = data.cells ?? {};
  const textDirection = gradeForm?.direction === "rtl" ? "rtl" : "ltr";
  const isRtl = textDirection === "rtl";
  const labels = gradeCardLabels(isRtl);
  const showYearlyAverage = gradeForm?.average ?? false;
  const tableFormat = resolveGradeFormTableFormat(gradeForm?.tableFormat);
  const courseOnTop = tableFormat === GRADE_FORM_TABLE_FORMAT.courseOnTop;
  const classSectionLabel = `${student.className} / ${student.sectionTitle}`;

  return (
    <article
      dir={textDirection}
      lang={isRtl ? "ar" : "en"}
      className={`grade-card-document grade-card-document--${textDirection} grade-card-document--${tableFormat}`}
    >
      <div className="grade-card-meta">
        <div className="grade-card-meta-item">
          <p className="grade-card-meta-label">{labels.studentName}</p>
          <p className="grade-card-meta-value">{student.studentName}</p>
        </div>
        <div className="grade-card-meta-item">
          <p className="grade-card-meta-label">{labels.classSection}</p>
          <p className="grade-card-meta-value">{classSectionLabel}</p>
        </div>
        <div className="grade-card-meta-item">
          <p className="grade-card-meta-label">{labels.academicYear}</p>
          <p className="grade-card-meta-value">{student.yearTitle}</p>
        </div>
        <div className="grade-card-meta-item">
          <p className="grade-card-meta-label">{labels.issueDate}</p>
          <p className="grade-card-meta-value">{issueDate}</p>
        </div>
      </div>

      {!gradeForm ? (
        <p className="grade-card-message">{labels.noForm}</p>
      ) : null}

      <div className="grade-card-table-wrap" dir={textDirection}>
        <table
          className={`grade-card-table grade-card-table--${tableFormat}`}
          dir={textDirection}
        >
          {courseOnTop ? (
            <GradeCardTableCourseOnTop
              labels={labels}
              courses={courses}
              gradeTypes={gradeTypes}
              cells={cells}
              showYearlyAverage={showYearlyAverage}
            />
          ) : (
            <GradeCardTableGradeOnTop
              labels={labels}
              courses={courses}
              gradeTypes={gradeTypes}
              cells={cells}
              showYearlyAverage={showYearlyAverage}
            />
          )}
        </table>
      </div>

      {gradeForm && !courseOnTop && gradeTypes.length === 0 && courses.length > 0 ? (
        <p className="grade-card-message">{labels.noDetails}</p>
      ) : null}
    </article>
  );
}

type OpenGradeViewProps = {
  registrationId: number;
  yearId: number;
  classId: number;
  sectionId: number;
  standalone?: boolean;
};

export function OpenGradeView({
  registrationId,
  yearId,
  classId,
  sectionId,
  standalone = false,
}: OpenGradeViewProps) {
  const backHref = `/export-grade-card?yearId=${yearId}&classId=${classId}&sectionId=${sectionId}`;

  if (standalone) {
    return (
      <div className="grade-card-page">
        <div className="grade-card-toolbar">
          <Link href={backHref}>Back</Link>
        </div>
        <OpenGradeTable
          registrationId={registrationId}
          yearId={yearId}
          classId={classId}
          sectionId={sectionId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:text-primary-hover"
      >
        Back to export grade card
      </Link>
      <OpenGradeTable
        registrationId={registrationId}
        yearId={yearId}
        classId={classId}
        sectionId={sectionId}
      />
    </div>
  );
}
