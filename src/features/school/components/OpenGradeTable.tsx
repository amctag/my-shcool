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

function formatMaxMark(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return rounded.toFixed(2);
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
  marksSum: number | null;
  scaledAverage: number | null;
  passed: boolean | null;
};

type GradeCardGradeType = {
  detailId: number;
  gradeTypeId: number;
  gradeTypeTitle: string;
  percentage: number | null;
};

function formatResult(
  passed: boolean | null | undefined,
  labels: GradeCardLabels,
): string {
  if (passed == null) {
    return "";
  }
  return passed ? labels.passed : labels.failed;
}

function GradeCardTableCourseOnTop({
  labels,
  courses,
  gradeTypes,
  cells,
  averageScale,
}: {
  labels: GradeCardLabels;
  courses: GradeCardCourse[];
  gradeTypes: GradeCardGradeType[];
  cells: Record<string, DashboardGradeCardCell>;
  averageScale: number;
}) {
  const hasCourses = courses.length > 0;
  const columnCount = 2 + Math.max(courses.length, 1);
  const coefficientsTotal = hasCourses
    ? courses.reduce((sum, course) => sum + course.coefficient, 0)
    : 0;
  const referenceMarksSum =
    coefficientsTotal > 0 ? formatMaxMark(coefficientsTotal) : "";
  const referenceAverage =
    averageScale > 0 ? formatMaxMark(averageScale) : "";

  return (
    <>
      <thead>
        <tr>
          <th className="course-cell">{labels.gradeType}</th>
          <th className="max-mark-cell">{labels.maxMark}</th>
          {hasCourses ? (
            courses.map((course) => (
              <th key={course.classCourseId} className="course-cell">
                {course.courseTitle}
              </th>
            ))
          ) : (
            <th>—</th>
          )}
        </tr>
        <tr>
          <th className="max-mark-cell">{labels.maxMark}</th>
          <th className="max-mark-cell">
            {coefficientsTotal > 0 ? formatMaxMark(coefficientsTotal) : ""}
          </th>
          {hasCourses ? (
            courses.map((course) => (
              <th key={`max-${course.classCourseId}`} className="max-mark-cell">
                {formatMaxMark(course.coefficient)}
              </th>
            ))
          ) : (
            <th>—</th>
          )}
        </tr>
      </thead>
      <tbody>
        {gradeTypes.length === 0 ? (
          <tr>
            <td colSpan={columnCount} style={{ padding: "2rem" }}>
              {labels.noDetails}
            </td>
          </tr>
        ) : !hasCourses ? (
          <tr>
            <td colSpan={columnCount} style={{ padding: "2rem" }}>
              {labels.noCourses}
            </td>
          </tr>
        ) : (
          <>
            {gradeTypes.map((gradeType) => (
              <tr key={gradeType.detailId}>
                <td className="course-cell">{gradeType.gradeTypeTitle}</td>
                <td className="max-mark-cell">{labels.emptyGrade}</td>
                {courses.map((course) => (
                  <td
                    key={`${gradeType.detailId}-${course.classCourseId}`}
                    className="grade-cell"
                  >
                    {getCellValue(cells, course.courseId, gradeType.gradeTypeId)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="summary-row">
              <td className="course-cell">{labels.marksSum}</td>
              <td className="max-mark-cell">{referenceMarksSum}</td>
              {courses.map((course) => (
                <td key={`sum-${course.classCourseId}`} className="grade-cell">
                  {formatScore(course.marksSum)}
                </td>
              ))}
            </tr>
            <tr className="summary-row">
              <td className="course-cell">{labels.result}</td>
              <td className="max-mark-cell">{labels.emptyGrade}</td>
              {courses.map((course) => (
                <td
                  key={`result-${course.classCourseId}`}
                  className="grade-cell"
                >
                  {formatResult(course.passed, labels)}
                </td>
              ))}
            </tr>
            <tr className="summary-row">
              <td className="course-cell">{labels.scaledAverage}</td>
              <td className="max-mark-cell">{referenceAverage}</td>
              {courses.map((course) => (
                <td
                  key={`avg-${course.classCourseId}`}
                  className="grade-cell"
                >
                  {formatScore(course.scaledAverage)}
                </td>
              ))}
            </tr>
          </>
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
  averageScale,
  passMinimum,
}: {
  labels: GradeCardLabels;
  courses: GradeCardCourse[];
  gradeTypes: GradeCardGradeType[];
  cells: Record<string, DashboardGradeCardCell>;
  averageScale: number;
  passMinimum: number;
}) {
  const gradeTypeColumns = Math.max(gradeTypes.length, 1);
  const columnCount = 2 + gradeTypeColumns;
  const coefficientsTotal = courses.reduce(
    (sum, course) => sum + course.coefficient,
    0,
  );
  function scoreOrZero(courseId: number, gradeTypeId: number): number {
    const cell = cells[gradeCardCellKey(courseId, gradeTypeId)];
    if (cell?.score == null || Number.isNaN(Number(cell.score))) {
      return 0;
    }
    return Number(cell.score);
  }

  function columnHasAnyScore(gradeTypeId: number): boolean {
    return courses.some((course) => {
      const cell = cells[gradeCardCellKey(course.courseId, gradeTypeId)];
      return cell?.score != null && !Number.isNaN(Number(cell.score));
    });
  }

  function columnMarksSum(gradeTypeId: number): number | null {
    if (!columnHasAnyScore(gradeTypeId)) {
      return null;
    }
    return courses.reduce(
      (sum, course) => sum + scoreOrZero(course.courseId, gradeTypeId),
      0,
    );
  }

  function columnScaledAverage(gradeTypeId: number): number | null {
    if (coefficientsTotal <= 0 || averageScale <= 0) {
      return null;
    }
    const marksSum = columnMarksSum(gradeTypeId);
    if (marksSum == null) {
      return null;
    }
    return Math.round((marksSum / coefficientsTotal) * averageScale * 100) / 100;
  }

  function marksSumGradeTypeCells() {
    if (gradeTypes.length === 0) {
      return (
        <td key="sum-empty" className="grade-cell">
          {labels.emptyGrade}
        </td>
      );
    }
    return gradeTypes.map((gradeType) => (
      <td key={`sum-${gradeType.detailId}`} className="grade-cell">
        {formatScore(columnMarksSum(gradeType.gradeTypeId))}
      </td>
    ));
  }

  function averageGradeTypeCells() {
    if (gradeTypes.length === 0) {
      return (
        <td key="avg-empty" className="grade-cell">
          {labels.emptyGrade}
        </td>
      );
    }
    return gradeTypes.map((gradeType) => (
      <td key={`avg-${gradeType.detailId}`} className="grade-cell">
        {formatScore(columnScaledAverage(gradeType.gradeTypeId))}
      </td>
    ));
  }

  function resultGradeTypeCells() {
    if (gradeTypes.length === 0) {
      return (
        <td key="result-empty" className="grade-cell">
          {labels.emptyGrade}
        </td>
      );
    }
    return gradeTypes.map((gradeType) => {
      const columnAverage = columnScaledAverage(gradeType.gradeTypeId);
      const passed =
        columnAverage == null ? null : columnAverage >= passMinimum;
      return (
        <td key={`result-${gradeType.detailId}`} className="grade-cell">
          {formatResult(passed, labels)}
        </td>
      );
    });
  }

  return (
    <>
      <thead>
        <tr>
          <th className="course-cell">{labels.course}</th>
          <th className="max-mark-cell">{labels.maxMark}</th>
          {gradeTypes.length > 0 ? (
            gradeTypes.map((gradeType) => (
              <th key={gradeType.detailId} className="grade-type-cell">
                {gradeType.gradeTypeTitle}
              </th>
            ))
          ) : (
            <th>—</th>
          )}
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
          <>
            {courses.map((course) => (
              <tr key={course.classCourseId}>
                <td className="course-cell">{course.courseTitle}</td>
                <td className="max-mark-cell">
                  {formatMaxMark(course.coefficient)}
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
              </tr>
            ))}
            <tr className="summary-row">
              <td className="course-cell">{labels.marksSum}</td>
              <td className="max-mark-cell">
                {coefficientsTotal > 0
                  ? formatMaxMark(coefficientsTotal)
                  : labels.emptyGrade}
              </td>
              {marksSumGradeTypeCells()}
            </tr>
            <tr className="summary-row">
              <td className="course-cell">{labels.result}</td>
              <td className="max-mark-cell">{labels.emptyGrade}</td>
              {resultGradeTypeCells()}
            </tr>
            <tr className="summary-row">
              <td className="course-cell">{labels.scaledAverage}</td>
              <td className="max-mark-cell">
                {averageScale > 0
                  ? formatMaxMark(averageScale)
                  : labels.emptyGrade}
              </td>
              {averageGradeTypeCells()}
            </tr>
          </>
        )}
      </tbody>
    </>
  );
}

function gradeCardLabels(isRtl: boolean) {
  if (isRtl) {
    return {
      title: "بطاقة علامات",
      studentName: "اسم التلميذ",
      classSection: "الصف و الشعبة",
      academicYear: "العام الدراسي",
      issueDate: "تاريخ الإصدار",
      course: "المادة",
      gradeType: "نوع العلامة",
      maxMark: "العلامة القصوى",
      marksSum: "مجموع العلامات",
      result: "النتيجة",
      scaledAverage: "المعدل",
      passed: "ناجح",
      failed: "راسب",
      emptyGrade: "",
      noForm: "لا يوجد نموذج علامات مرتبط بهذا الصف للعام المحدد.",
      noCourses: "لا توجد مواد لهذا الصف.",
      noDetails: "لا توجد تفاصيل ظاهرة في نموذج العلامات.",
    };
  }

  return {
    title: "Grade card",
    studentName: "Student name",
    classSection: "Class & section",
    academicYear: "Academic year",
    issueDate: "Issue date",
    course: "Course",
    gradeType: "Grade type",
    maxMark: "Max mark",
    marksSum: "Marks sum",
    result: "Result",
    scaledAverage: "Average",
    passed: "Passed",
    failed: "Failed",
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
  const tableFormat = resolveGradeFormTableFormat(gradeForm?.tableFormat);
  const courseOnTop = tableFormat === GRADE_FORM_TABLE_FORMAT.courseOnTop;
  const classSectionLabel = `${student.className}/${student.sectionTitle}`;
  const averageScale = Number(gradeForm?.average ?? 0);
  const passMinimum = Number(gradeForm?.minimum ?? 0);

  return (
    <article
      dir={textDirection}
      lang={isRtl ? "ar" : "en"}
      className={`grade-card-document grade-card-document--${textDirection} grade-card-document--${tableFormat}`}
    >
      <header className="grade-card-header">
        <h1 className="grade-card-title">{labels.title}</h1>
        <div className="grade-card-meta">
          <span className="grade-card-meta-label">{labels.studentName}</span>
          <span className="grade-card-meta-value">{student.studentName}</span>
          <span className="grade-card-meta-label">{labels.academicYear}</span>
          <span className="grade-card-meta-value">{student.yearTitle}</span>
          <span className="grade-card-meta-label">{labels.classSection}</span>
          <span className="grade-card-meta-value">{classSectionLabel}</span>
          <span className="grade-card-meta-label">{labels.issueDate}</span>
          <span className="grade-card-meta-value">{issueDate}</span>
        </div>
      </header>

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
              averageScale={averageScale}
            />
          ) : (
            <GradeCardTableGradeOnTop
              labels={labels}
              courses={courses}
              gradeTypes={gradeTypes}
              cells={cells}
              averageScale={averageScale}
              passMinimum={passMinimum}
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
          <button type="button" onClick={() => window.print()}>
            Print / PDF
          </button>
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
