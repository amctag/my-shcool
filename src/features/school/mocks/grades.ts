export type GradeByCourseRow = {
  id: number;
  yearTitle: string;
  courseTitle: string;
  sectionTitle: string;
  createdAt: string;
  maxGrade: number;
  gradeTypeTitle: string;
};

export type GradeByTypeRow = {
  id: number;
  title: string;
  type: string;
  status: boolean;
};

export const mockGradesByCourse: GradeByCourseRow[] = [
  {
    id: 1,
    yearTitle: "2026-2027",
    courseTitle: "Mathematics",
    sectionTitle: "A",
    createdAt: "2026-03-10T09:30:00.000Z",
    maxGrade: 100,
    gradeTypeTitle: "Midterm",
  },
  {
    id: 2,
    yearTitle: "2026-2027",
    courseTitle: "English",
    sectionTitle: "A",
    createdAt: "2026-03-12T11:15:00.000Z",
    maxGrade: 100,
    gradeTypeTitle: "Midterm",
  },
  {
    id: 3,
    yearTitle: "2026-2027",
    courseTitle: "Science",
    sectionTitle: "B",
    createdAt: "2026-06-01T08:00:00.000Z",
    maxGrade: 50,
    gradeTypeTitle: "Quiz",
  },
  {
    id: 4,
    yearTitle: "2026-2027",
    courseTitle: "Mathematics",
    sectionTitle: "B",
    createdAt: "2026-06-20T14:45:00.000Z",
    maxGrade: 100,
    gradeTypeTitle: "Final",
  },
];

export const mockGradesByType: GradeByTypeRow[] = [
  {
    id: 1,
    title: "Midterm",
    type: "exam",
    status: true,
  },
  {
    id: 2,
    title: "Final",
    type: "exam",
    status: true,
  },
  {
    id: 3,
    title: "Quiz",
    type: "assignment",
    status: true,
  },
  {
    id: 4,
    title: "Homework",
    type: "assignment",
    status: false,
  },
];
