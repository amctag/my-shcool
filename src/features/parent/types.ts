import type { PaginationMeta, PaginatedQuery } from "@/types/pagination";

export type StudentFilterQuery = {
  studentId?: number;
};

export type ParentProfile = {
  personId: number;
  parentId: number;
  username: string;
  firstName: string;
  middleName: string;
  lastName: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  childrenCount: number;
};

export type ParentChildSummary = {
  studentId: number;
  registrationId: number | null;
  name: string;
  yearTitle: string | null;
};

export type ParentChildrenSummaryResponse = {
  children: ParentChildSummary[];
};

export type ParentChildRegistration = {
  id: number;
  sectionId: number;
  className: string;
  sectionTitle: string;
  yearTitle: string;
  schoolId: number;
  schoolName: string;
};

export type ParentChildDetail = {
  studentId: number;
  personId: number;
  registerId: number | null;
  username: string;
  firstName: string;
  middleName: string;
  lastName: string;
  name: string;
  email: string | null;
  gender: number | null;
  birthday: string | null;
  schoolId: number;
  schoolName: string;
  motherName: string | null;
  motherFamily: string | null;
  motherPhone: string | null;
  registration: ParentChildRegistration | null;
};

export type ChangePasswordRequestOtpResponse = {
  message: string;
  email: string;
  expiresInMinutes: number;
};

export type ChangePasswordRequest = {
  otp: string;
  newPassword: string;
  confirmPassword: string;
};

export type WeeklyScheduleCourse = {
  courseId: number;
  courseTitle: string;
  sessionName: string;
  sessionPosition: number;
  teacherName: string | null;
  note: string | null;
};

export type WeeklyScheduleDay = {
  dayName: string;
  position: number;
  courses: WeeklyScheduleCourse[];
};

export type ParentChildWeeklySchedule = {
  studentId: number;
  studentName: string;
  sectionName: string;
  class: string;
  schoolName: string;
  yearTitle: string;
  days: WeeklyScheduleDay[];
};

export type ParentWeeklyScheduleResponse = {
  schedules: ParentChildWeeklySchedule[];
};

export type ParentGradeItem = {
  id: number;
  schoolId: number;
  courseTitle: string;
  gradeTypeTitle: string;
  yearId: number;
  yearTitle: string;
  maxGrade: number;
  score: number | null;
  comment: string | null;
  publishDate: string;
};

export type ParentStudentGrades = {
  studentId: number;
  registrationId: number;
  studentName: string;
  schoolId: number;
  schoolName: string;
  className: string;
  sectionName: string;
  yearId: number;
  yearTitle: string;
  grades: ParentGradeItem[];
};

export type ParentGradesResponse = {
  students: ParentStudentGrades[];
};

export type ParentGradesQuery = StudentFilterQuery & {
  registrationId?: number;
};

export type ParentExamScheduleCourse = {
  id: number;
  courseTitle: string;
  position: number;
  startTime: string;
  duration: number;
  note: string | null;
};

export type ParentExamScheduleDate = {
  id: number;
  date: string;
  dayName: string;
  exams: ParentExamScheduleCourse[];
};

export type ParentExamScheduleItem = {
  id: number;
  title: string;
  gradeTypeTitle: string;
  yearTitle: string;
  note: string | null;
  dates: ParentExamScheduleDate[];
};

export type ParentStudentExamSchedules = {
  studentId: number;
  studentName: string;
  schoolName: string;
  className: string;
  sectionName: string;
  examSchedules: ParentExamScheduleItem[];
};

export type ParentExamSchedulesResponse = {
  students: ParentStudentExamSchedules[];
};

export type ParentExamScheduleDetail = ParentExamScheduleItem & {
  studentId: number;
  studentName: string;
  schoolName: string;
  className: string;
  sectionName: string;
};

export type ParentAnnouncementItem = {
  id: number;
  title: string | null;
  content: string;
  publishedAt: string;
  isGlobal: boolean;
  schoolName: string;
  sectionName: string | null;
  class: string | null;
};

export type ParentAnnouncementsResponse = {
  announcements: ParentAnnouncementItem[];
};

export type ParentActivityItem = {
  id: number;
  title: string;
  content: string;
  date: string;
  image: string;
  yearTitle: string | null;
  schoolName: string;
};

export type ParentActivitiesResponse = {
  activities: ParentActivityItem[];
};

export type ParentNoticeItem = {
  id: number;
  studentId: number;
  studentName: string;
  description: string;
  date: string;
  schoolName: string;
  sectionName: string;
  class: string;
  receivedVia: "student" | "section";
};

export type ParentNoticesResponse = {
  notices: ParentNoticeItem[];
  pagination: PaginationMeta;
};

export type ParentNoticesQuery = StudentFilterQuery & PaginatedQuery;

export type ParentAttendanceAbsenceItem = {
  studentId: number;
  studentName: string;
  date: string;
  status: string;
  reason: string | null;
  description: string | null;
};

export type ParentAttendanceAbsencesResponse = {
  month: string;
  absences: ParentAttendanceAbsenceItem[];
};

export type ParentAttendanceAbsencesQuery = StudentFilterQuery & {
  month: string;
};

export type ParentAgendaItem = {
  id: number;
  studentId: number;
  studentName: string;
  description: string;
  agendaDate: string;
  time: string;
  courseTitle: string;
  imageLink: string;
  fileLink: string;
  publishedDate: string;
  schoolName: string;
  sectionName: string;
  class: string;
};

export type ParentAgendasResponse = {
  agendaDate: string;
  agendas: ParentAgendaItem[];
  pagination: PaginationMeta;
};

export type ParentAgendasQuery = StudentFilterQuery &
  PaginatedQuery & {
    agendaDate: string;
  };

export type ParentAlbumImage = {
  id: number;
  imageLink: string;
  caption: string | null;
  position: number;
};

export type ParentAlbumItem = {
  id: number;
  title: string;
  description: string;
  date: string;
  yearTitle: string;
  images: ParentAlbumImage[];
};

export type ParentSchoolAlbums = {
  schoolId: number;
  schoolName: string;
  albums: ParentAlbumItem[];
};

export type ParentAlbumsResponse = {
  schools: ParentSchoolAlbums[];
};

export type ParentAlbumDetail = {
  id: number;
  schoolId: number;
  schoolName: string;
  title: string;
  description: string;
  date: string;
  yearTitle: string;
  images: ParentAlbumImage[];
};

export type ParentSchoolDetailsResponse = {
  schools: SchoolDetails[];
};

export type SchoolDetails = {
  id: number;
  schoolId: number;
  schoolName: string;
  telephone: string;
  phone: string;
  fax: string;
  address: string;
  email: string;
  website: string;
  about: string;
};
