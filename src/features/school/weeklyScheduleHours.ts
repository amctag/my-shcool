import type { DashboardClassCourse } from "@/features/school/types";

export type CourseHourUsage = {
  courseId: number;
  courseTitle: string;
  allowedHours: number;
  usedHours: number;
};

export type CourseHourViolation = CourseHourUsage & {
  overBy: number;
};

export function countUsedHoursByCourse(
  cellCourses: Record<string, number>,
): Map<number, number> {
  const usedByCourse = new Map<number, number>();

  for (const courseId of Object.values(cellCourses)) {
    if (courseId > 0) {
      usedByCourse.set(courseId, (usedByCourse.get(courseId) ?? 0) + 1);
    }
  }

  return usedByCourse;
}

export function getCourseHourViolations(
  cellCourses: Record<string, number>,
  classCourses: DashboardClassCourse[],
): CourseHourViolation[] {
  const usedByCourse = countUsedHoursByCourse(cellCourses);
  const courseById = new Map(
    classCourses.map((item) => [item.courseId, item]),
  );
  const violations: CourseHourViolation[] = [];

  for (const [courseId, usedHours] of usedByCourse) {
    const classCourse = courseById.get(courseId);
    if (!classCourse || classCourse.numberOfHours == null) {
      continue;
    }
    if (usedHours > classCourse.numberOfHours) {
      violations.push({
        courseId,
        courseTitle: classCourse.courseTitle,
        allowedHours: classCourse.numberOfHours,
        usedHours,
        overBy: usedHours - classCourse.numberOfHours,
      });
    }
  }

  return violations.sort((left, right) =>
    left.courseTitle.localeCompare(right.courseTitle),
  );
}

export function getCourseHourUsageSummary(
  cellCourses: Record<string, number>,
  classCourses: DashboardClassCourse[],
): CourseHourUsage[] {
  const usedByCourse = countUsedHoursByCourse(cellCourses);
  const courseById = new Map(
    classCourses.map((item) => [item.courseId, item]),
  );
  const summary: CourseHourUsage[] = [];

  for (const [courseId, usedHours] of usedByCourse) {
    const classCourse = courseById.get(courseId);
    if (!classCourse || classCourse.numberOfHours == null) {
      continue;
    }
    summary.push({
      courseId,
      courseTitle: classCourse.courseTitle,
      allowedHours: classCourse.numberOfHours,
      usedHours,
    });
  }

  return summary.sort((left, right) =>
    left.courseTitle.localeCompare(right.courseTitle),
  );
}
