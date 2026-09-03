export type DashboardParent = {
  id: number;
  fullName: string;
  firstName?: string;
  lastName?: string;
  address: string | null;
  phoneNumber: string | null;
  childrenCount: number;
  status?: boolean;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type DashboardParentsResponse = {
  items: DashboardParent[];
  pagination: PaginationMeta;
};

export type ParentsSortBy =
  | "id"
  | "name"
  | "address"
  | "phone"
  | "childrenCount";
export type ParentsSortOrder = "asc" | "desc";

export type StudentsSortBy =
  | "id"
  | "username"
  | "name"
  | "class"
  | "parent"
  | "birthday"
  | "address"
  | "phone";
export type StudentsSortOrder = "asc" | "desc";

export type DashboardParentChild = {
  id: number;
  fullName: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  parentId: number | null;
  parentName: string | null;
  className: string | null;
  sectionName: string | null;
  yearTitle: string | null;
  birthday?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
};

export type DashboardChildrenQuery = {
  page: number;
  limit: number;
  parentId?: number;
  search?: string;
  name?: string;
  id?: number;
  sortBy?: StudentsSortBy;
  sortOrder?: StudentsSortOrder;
};

export type DashboardChildrenResponse = {
  items: DashboardParentChild[];
  pagination: PaginationMeta;
};

export type PersonStatusFilter = "all" | "active" | "closed";

export type DashboardParentsQuery = {
  page: number;
  limit: number;
  search?: string;
  name?: string;
  id?: number;
  status?: "active" | "closed";
  sortBy?: ParentsSortBy;
  sortOrder?: ParentsSortOrder;
};

export type LookupItem = {
  id: number;
  name: string;
  isDefault?: boolean;
};

export type RegionItem = LookupItem & {
  governorateId: number;
};

export type DashboardParentOption = {
  id: number;
  fullName: string;
  firstName?: string;
  middleName?: string;
  lastName: string;
};

export type DashboardParentDetail = {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: number | null;
  nationalityId: number | null;
  governorateId: number | null;
  registerId: number | null;
  regionId: number | null;
  currentJobId: number | null;
  identityNumber: string | null;
  email: string | null;
  phoneNumber: string | null;
  urgentNumber: string | null;
  landline: string | null;
  address: string | null;
  village: string | null;
  placeOfBirth: string | null;
  description: string | null;
  birthday: string | null;
  status: boolean;
};

export type SaveParentBody = {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: number;
  nationalityId?: number;
  governorateId?: number;
  registerId?: number | null;
  regionId?: number;
  currentJobId?: number;
  identityNumber?: string;
  email?: string;
  phoneNumber: string;
  urgentNumber?: string;
  landline?: string;
  address?: string;
  village?: string;
  placeOfBirth?: string;
  description?: string;
  birthday?: string;
  status?: boolean;
};

export type TeachersSortBy = "id" | "name" | "phone" | "address" | "birthday";
export type TeachersSortOrder = "asc" | "desc";

export type DashboardTeacher = {
  id: number;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phoneNumber: string | null;
  address: string | null;
  birthday?: string | null;
  status?: boolean;
};

export type DashboardTeachersQuery = {
  page: number;
  limit: number;
  search?: string;
  name?: string;
  id?: number;
  status?: "active" | "closed";
  sortBy?: TeachersSortBy;
  sortOrder?: TeachersSortOrder;
};

export type DashboardTeachersResponse = {
  items: DashboardTeacher[];
  pagination: PaginationMeta;
};

export type DashboardTeacherDetail = {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: number | null;
  nationalityId: number | null;
  governorateId: number | null;
  registerId: number | null;
  regionId: number | null;
  identityNumber: string | null;
  email: string | null;
  phoneNumber: string | null;
  urgentNumber: string | null;
  landline: string | null;
  address: string | null;
  village: string | null;
  placeOfBirth: string | null;
  birthday: string | null;
  status: boolean;
};

export type SaveTeacherBody = {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: number;
  nationalityId?: number;
  governorateId?: number;
  registerId?: number | null;
  regionId?: number;
  identityNumber?: string;
  email?: string;
  phoneNumber: string;
  urgentNumber?: string;
  landline?: string;
  address?: string;
  village?: string;
  placeOfBirth?: string;
  birthday?: string;
};

export type DashboardStudentDetail = {
  id: number;
  parentId: number;
  parentName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: number | null;
  nationalityId: number | null;
  bloodTypeId: number | null;
  governorateId: number | null;
  registerId: number | null;
  regionId: number | null;
  identityNumber: string | null;
  email: string | null;
  phoneNumber: string | null;
  urgentNumber: string | null;
  landline: string | null;
  address: string | null;
  village: string | null;
  placeOfBirth: string | null;
  birthday: string | null;
  motherName: string | null;
  motherFamily: string | null;
  motherPhone: string | null;
};

export type SaveStudentBody = {
  parentId: number;
  firstName: string;
  gender?: number;
  nationalityId?: number;
  bloodTypeId?: number;
  governorateId?: number;
  registerId?: number | null;
  regionId?: number;
  identityNumber?: string;
  email?: string;
  phoneNumber?: string;
  landline?: string;
  address?: string;
  village?: string;
  placeOfBirth?: string;
  birthday?: string;
  motherName?: string;
  motherFamily?: string;
  motherPhone?: string;
};

export type ClassesSortOrder = "asc" | "desc";

export type DashboardClassesQuery = {
  page?: number;
  limit?: number;
  search?: string;
  stageId?: number;
  sortOrder?: ClassesSortOrder;
};

export type DashboardClass = {
  id: number;
  className: string;
  classLevel: number;
  position: number;
  stageId: number;
  stageTitle: string;
};

export type DashboardClassesResponse = {
  items: DashboardClass[];
  pagination: PaginationMeta;
};

export type DashboardStage = {
  id: number;
  title: string;
  position: number;
};

export type SectionsSortBy = "id" | "class" | "section" | "year" | "students";
export type SectionsSortOrder = "asc" | "desc";

export type DashboardSection = {
  id: number;
  classId: number;
  className: string;
  sectionTitleId: number;
  sectionTitle: string;
  yearId: number;
  yearTitle: string;
  isCurrentYear: boolean;
  status: number;
  studentCount: number;
};

export type DashboardSectionsQuery = {
  page: number;
  limit: number;
  search?: string;
  classId?: number;
  yearId?: number;
  sortBy?: SectionsSortBy;
  sortOrder?: SectionsSortOrder;
};

export type DashboardSectionsResponse = {
  items: DashboardSection[];
  pagination: PaginationMeta;
};

export type DashboardYear = {
  id: number;
  title: string;
  isCurrent: boolean;
};

export type DashboardSectionTitle = {
  id: number;
  title: string;
  status: number;
  sectionCount: number;
};

export type SaveSectionTitleBody = {
  title: string;
  status?: number;
};

export type SaveSectionBody = {
  classId: number;
  sectionTitleId: number;
  yearId?: number;
  status?: number;
};

export type DashboardCourse = {
  id: number;
  title: string;
  description: string | null;
  status: boolean;
  classCourseCount: number;
};

export type SaveCourseBody = {
  title: string;
  description?: string;
  status?: boolean;
};

export type ClassCoursesSortBy = "id" | "class" | "course" | "year" | "hours";
export type ClassCoursesSortOrder = "asc" | "desc";

export type DashboardClassCourse = {
  id: number;
  classId: number;
  className: string;
  courseId: number;
  courseTitle: string;
  yearId: number;
  yearTitle: string;
  isCurrentYear: boolean;
  coefficient: number;
  numberOfHours: number | null;
  status: boolean;
};

export type DashboardClassCoursesQuery = {
  page: number;
  limit: number;
  search?: string;
  classId?: number;
  courseId?: number;
  yearId?: number;
  status?: "active" | "inactive";
  sortBy?: ClassCoursesSortBy;
  sortOrder?: ClassCoursesSortOrder;
};

export type DashboardClassCoursesResponse = {
  items: DashboardClassCourse[];
  pagination: PaginationMeta;
};

export type SaveClassCourseBody = {
  classId: number;
  courseId: number;
  yearId?: number;
  coefficient?: number;
  numberOfHours?: number | null;
  status?: boolean;
};

export type TeachesSortBy =
  | "id"
  | "teacher"
  | "class"
  | "section"
  | "course"
  | "year";
export type TeachesSortOrder = "asc" | "desc";

export type DashboardTeach = {
  id: number;
  teacherId: number;
  teacherName: string;
  classId: number;
  className: string;
  sectionId: number;
  sectionTitle: string;
  courseId: number;
  courseTitle: string;
  yearId: number;
  yearTitle: string;
  isCurrentYear: boolean;
};

export type DashboardTeachesQuery = {
  page: number;
  limit: number;
  search?: string;
  classId?: number;
  sectionId?: number;
  courseId?: number;
  teacherId?: number;
  yearId?: number;
  sortBy?: TeachesSortBy;
  sortOrder?: TeachesSortOrder;
};

export type DashboardTeachesResponse = {
  items: DashboardTeach[];
  pagination: PaginationMeta;
};

export type SaveTeachBody = {
  teacherId: number;
  sectionId: number;
  courseId: number;
  yearId?: number;
};

export type DashboardAnnouncement = {
  id: number;
  title: string | null;
  content: string;
  scope: string;
  audienceTargets: AnnouncementAudienceTarget[];
  audienceLabel: string;
  publishedAt: string;
  createdAt: string;
  personId: number;
  createdByName: string;
};

export type DashboardAnnouncementsResponse = {
  items: DashboardAnnouncement[];
  pagination: PaginationMeta;
};

export type DashboardAnnouncementsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  yearId?: number;
  classId?: number;
  sectionId?: number;
};

export type AnnouncementAudienceTarget = "parent" | "student" | "teacher";

export type SaveAnnouncementBody = {
  title?: string;
  content: string;
  audienceTargets: AnnouncementAudienceTarget[];
  sectionId?: number;
};

export type DashboardWeeklySchedule = {
  id: number;
  sectionId: number;
  classId: number;
  yearId: number;
  className: string;
  sectionTitle: string;
  yearTitle: string;
  createdAt: string;
  createdByName: string | null;
};

export type WeeklySchedulesSortBy =
  | "id"
  | "year"
  | "class"
  | "section"
  | "person"
  | "date";

export type WeeklySchedulesSortOrder = "asc" | "desc";

export type DashboardWeeklySchedulesQuery = {
  page: number;
  limit: number;
  search?: string;
  yearId?: number;
  classId?: number;
  sectionId?: number;
  sortBy: WeeklySchedulesSortBy;
  sortOrder: WeeklySchedulesSortOrder;
};

export type DashboardWeeklySchedulesResponse = {
  items: DashboardWeeklySchedule[];
  pagination: PaginationMeta;
};

export type DashboardWeeklyScheduleGridQuery = {
  sectionId: number;
  yearId?: number;
  classId?: number;
};

export type DashboardWeeklySchedulesGridsQuery = {
  yearId?: number;
  classId?: number;
  sectionId?: number;
};

export type DashboardWeeklySchedulesGridsResponse = {
  items: DashboardWeeklyScheduleGridResponse[];
};

export type DashboardWeeklyScheduleGridDay = {
  id: number;
  dayName: string;
  position: number;
};

export type DashboardWeeklyScheduleGridSession = {
  id: number;
  sessionName: string;
  position: number;
};

export type DashboardWeeklyScheduleGridCell = {
  dayId: number;
  sessionId: number;
  detailId: number | null;
  courseId: number | null;
  courseTitle: string | null;
  personId: number | null;
  createdByName: string | null;
};

export type DashboardWeeklyScheduleGridResponse = {
  scheduleId: number | null;
  sectionId: number;
  classId: number;
  yearId: number;
  yearTitle: string;
  className: string;
  sectionTitle: string;
  days: DashboardWeeklyScheduleGridDay[];
  sessions: DashboardWeeklyScheduleGridSession[];
  cells: DashboardWeeklyScheduleGridCell[];
};

export type SaveWeeklyScheduleEntry = {
  dayId: number;
  sessionId: number;
  courseId: number;
};

export type SaveWeeklyScheduleBody = {
  sectionId: number;
  yearId?: number;
  classId?: number;
  entries: SaveWeeklyScheduleEntry[];
};

export type DashboardExamSchedule = {
  id: number;
  title: string;
  classId: number;
  className: string;
  yearId: number;
  yearTitle: string;
  gradeTypeId: number;
  gradeTypeTitle: string;
  examDate: string | null;
  examDateEnd: string | null;
  examDatesCount: number;
  createdAt: string;
  createdByName: string | null;
};

export type ExamSchedulesSortBy =
  | "id"
  | "title"
  | "class"
  | "gradeType"
  | "year"
  | "date";

export type ExamSchedulesSortOrder = "asc" | "desc";

export type DashboardExamSchedulesQuery = {
  page: number;
  limit: number;
  search?: string;
  yearId?: number;
  classId?: number;
  sortBy: ExamSchedulesSortBy;
  sortOrder: ExamSchedulesSortOrder;
};

export type DashboardExamSchedulesResponse = {
  items: DashboardExamSchedule[];
  pagination: PaginationMeta;
};

export type DashboardExamScheduleExam = {
  id: number;
  courseId: number;
  courseTitle: string;
  position: number;
  startTime: string;
  duration: number;
  note: string | null;
};

export type DashboardExamScheduleDate = {
  id: number;
  date: string;
  exams: DashboardExamScheduleExam[];
};

export type DashboardExamScheduleDetail = {
  id: number;
  title: string;
  classId: number;
  className: string;
  yearId: number;
  yearTitle: string;
  gradeTypeId: number;
  gradeTypeTitle: string;
  note: string | null;
  dates: DashboardExamScheduleDate[];
};

export type DashboardGradeType = {
  id: number;
  title: string;
};

export type DashboardGradeTypesResponse = {
  items: DashboardGradeType[];
};

export type SaveExamScheduleExamBody = {
  courseId: number;
  position?: number;
  startTime: string;
  duration: number;
  note?: string;
};

export type SaveExamScheduleDateBody = {
  date: string;
  exams?: SaveExamScheduleExamBody[];
};

export type SaveExamScheduleBody = {
  title: string;
  classId: number;
  yearId?: number;
  gradeTypeId: number;
  note?: string;
  dates?: SaveExamScheduleDateBody[];
};

export type DashboardRegistration = {
  id: number;
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  sectionId: number;
  sectionTitle: string;
  yearId: number;
  yearTitle: string;
  createdAt: string;
};

export type RegistrationsSortBy =
  | "id"
  | "student"
  | "class"
  | "section"
  | "year"
  | "date";

export type RegistrationsSortOrder = "asc" | "desc";

export type DashboardRegistrationsQuery = {
  page: number;
  limit: number;
  search?: string;
  classId?: number;
  sectionId?: number;
  yearId?: number;
  sortBy?: RegistrationsSortBy;
  sortOrder?: RegistrationsSortOrder;
};

export type DashboardRegistrationsResponse = {
  items: DashboardRegistration[];
  pagination: PaginationMeta;
};

export type SaveRegistrationBody = {
  studentId: number;
  classId: number;
  sectionId: number;
};

export type DashboardGradeTypeListItem = {
  id: number;
  schoolId: number | null;
  title: string;
  isAbstract: boolean;
  position: number;
  isMain: boolean;
  type: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DashboardGradeTypesListResponse = {
  items: DashboardGradeTypeListItem[];
};

export type SaveGradeTypeBody = {
  title: string;
  isAbstract?: boolean;
  position?: number;
  isMain?: boolean;
  type: string;
  status?: boolean;
};

export type DashboardGradeCardQuery = {
  registrationId: number;
  yearId?: number;
  classId?: number;
  sectionId?: number;
};

export type DashboardGradeCardCell = {
  score: number | null;
  maxGrade: number | null;
  comment: string | null;
};

export type DashboardGradeCardResponse = {
  student: {
    registrationId: number;
    studentId: number;
    studentName: string;
    classId: number;
    className: string;
    sectionId: number;
    sectionTitle: string;
    yearId: number;
    yearTitle: string;
  };
  gradeForm: {
    id: number;
    title: string;
    direction: string;
    tableFormat: string;
    average: number;
    minimum: number;
  } | null;
  courses: Array<{
    classCourseId: number;
    courseId: number;
    courseTitle: string;
    coefficient: number;
    marksSum: number | null;
    scaledAverage: number | null;
    passed: boolean | null;
    yearlyAverage: number | null;
  }>;
  gradeTypes: Array<{
    detailId: number;
    gradeTypeId: number;
    gradeTypeTitle: string;
    position: number;
    percentage: number | null;
  }>;
  cells: Record<string, DashboardGradeCardCell>;
};

export function gradeCardCellKey(
  courseId: number,
  gradeTypeId: number,
): string {
  return `${courseId}-${gradeTypeId}`;
}

export type DashboardGradeByCourse = {
  id: number;
  yearId: number;
  yearTitle: string;
  courseId: number;
  courseTitle: string;
  sectionId: number;
  sectionTitle: string;
  className: string;
  gradeTypeId: number;
  gradeTypeTitle: string;
  maxGrade: number;
  publishDate: string | null;
  createdAt: string;
  studentCount: number;
};

export type GradesByCourseSortBy =
  | "id"
  | "year"
  | "course"
  | "section"
  | "date"
  | "maxGrade"
  | "gradeType";

export type GradesByCourseSortOrder = "asc" | "desc";

export type DashboardGradesByCourseQuery = {
  page: number;
  limit: number;
  search?: string;
  yearId?: number;
  classId?: number;
  sectionId?: number;
  courseId?: number;
  gradeTypeId?: number;
  sortBy?: GradesByCourseSortBy;
  sortOrder?: GradesByCourseSortOrder;
};

export type DashboardGradesByCourseResponse = {
  items: DashboardGradeByCourse[];
  pagination: PaginationMeta;
};

export type DashboardGradeByCourseStudent = {
  registrationId: number;
  studentId: number;
  studentName: string;
  grade: number | null;
  comment: string | null;
};

export type DashboardGradeByCourseCandidates = {
  gradeSheetId: number | null;
  maxGrade: number;
  publishDate: string | null;
  students: DashboardGradeByCourseStudent[];
};

export type DashboardGradeByCourseDetail = {
  id: number;
  yearId: number;
  yearTitle: string;
  classId: number;
  className: string;
  courseId: number;
  courseTitle: string;
  sectionId: number;
  sectionTitle: string;
  gradeTypeId: number;
  gradeTypeTitle: string;
  maxGrade: number;
  publishDate: string | null;
  createdAt: string;
  students: DashboardGradeByCourseStudent[];
};

export type SaveGradeByCourseEntry = {
  registrationId: number;
  grade?: number;
  comment?: string;
};

export type SaveGradeByCourseBody = {
  sectionId: number;
  courseId: number;
  gradeTypeId: number;
  maxGrade: number;
  publishDate?: string;
  entries: SaveGradeByCourseEntry[];
};

export type GradeFormsSortBy =
  | "id"
  | "title"
  | "year"
  | "direction"
  | "tableFormat"
  | "status"
  | "date";

export type GradeFormsSortOrder = "asc" | "desc";

export const GRADE_FORM_TABLE_FORMAT = {
  courseOnTop: "course_on_top",
  gradeOnTop: "grade_on_top",
} as const;

export type GradeFormTableFormat =
  (typeof GRADE_FORM_TABLE_FORMAT)[keyof typeof GRADE_FORM_TABLE_FORMAT];

export function resolveGradeFormTableFormat(
  value: string | null | undefined,
): GradeFormTableFormat {
  return value === GRADE_FORM_TABLE_FORMAT.courseOnTop
    ? GRADE_FORM_TABLE_FORMAT.courseOnTop
    : GRADE_FORM_TABLE_FORMAT.gradeOnTop;
}

export type DashboardGradeForm = {
  id: number;
  title: string;
  yearId: number;
  yearTitle: string;
  gradeBackground: string | null;
  average: number;
  minimum: number;
  direction: string;
  tableFormat: string;
  gradeFormatId: number;
  status: boolean;
  classNames: string[];
  detailCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DashboardGradeFormDetail = DashboardGradeForm & {
  classIds: number[];
};

export type DashboardGradeFormsQuery = {
  page: number;
  limit: number;
  search?: string;
  yearId?: number;
  sortBy?: GradeFormsSortBy;
  sortOrder?: GradeFormsSortOrder;
};

export type DashboardGradeFormsResponse = {
  items: DashboardGradeForm[];
  pagination: PaginationMeta;
};

export type CreateGradeFormBody = {
  title: string;
  yearId: number;
  gradeBackground?: string;
  average?: number;
  minimum?: number;
  direction?: string;
  tableFormat?: string;
  gradeFormatId: number;
  status?: boolean;
  classIds?: number[];
};

export type UpdateGradeFormBody = Partial<CreateGradeFormBody>;

export type DashboardGradeFormClassOption = {
  id: number;
  className: string;
};

export type DashboardGradeFormCourseItem = {
  courseId: number;
  courseTitle: string;
  classNames: string[];
};

export type DashboardGradeFormClassesCourses = {
  gradeFormId: number;
  title: string;
  yearId: number;
  yearTitle: string;
  classIds: number[];
  classes: DashboardGradeFormClassOption[];
  courses: DashboardGradeFormCourseItem[];
};

export type UpdateGradeFormClassesBody = {
  classIds: number[];
};

export type DashboardGradeFormExpressionItem = {
  id: number;
  sourceGradeTypeId: number;
  sourceGradeTypeTitle: string;
  percentage: number;
};

export type DashboardGradeFormDetailRow = {
  id: number;
  gradeFormId: number;
  gradeTypeId: number;
  gradeTypeTitle: string;
  position: number;
  percentage: number | null;
  expressions: DashboardGradeFormExpressionItem[];
  status: boolean;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DashboardGradeFormDetailsList = {
  gradeFormId: number;
  title: string;
  items: DashboardGradeFormDetailRow[];
};

export type DashboardGradeFormByClass = {
  gradeForm: DashboardGradeFormDetail | null;
  details: DashboardGradeFormDetailRow[];
};

export type SaveGradeFormDetailBody = {
  gradeTypeId: number;
  position?: number;
  percentage?: number;
  status?: boolean;
  isVisible?: boolean;
};

export type DashboardGradeFormExpressionTypeOption = {
  id: number;
  title: string;
  used: boolean;
};

export type DashboardGradeFormExpressionTypes = {
  items: DashboardGradeFormExpressionTypeOption[];
};

export type DashboardGradeFormExpressions = {
  items: DashboardGradeFormExpressionItem[];
};

export type SaveGradeFormExpressionBody = {
  sourceGradeTypeId: number;
  percentage: number;
};

