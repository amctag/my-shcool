import type {
  ParentActivityItem,
  ParentAgendaItem,
  ParentAlbumItem,
  ParentAnnouncementItem,
  ParentAttendanceAbsenceItem,
  ParentChildDetail,
  ParentChildSummary,
  ParentChildWeeklySchedule,
  ParentNoticeItem,
  ParentProfile,
  ParentStudentExamSchedules,
  ParentStudentGrades,
  SchoolDetails,
} from "@/features/parent/types";

export const fakeParentProfile: ParentProfile = {
  personId: 1,
  parentId: 1,
  username: "ahmad.khalil",
  firstName: "Ahmad",
  middleName: "Hassan",
  lastName: "Khalil",
  name: "Ahmad Hassan Khalil",
  email: "ahmad.khalil@example.com",
  phoneNumber: "+96170000001",
  childrenCount: 2,
};

export const fakeChildren: ParentChildSummary[] = [
  {
    studentId: 1,
    registrationId: 12,
    name: "Layla Ahmad Khalil",
    yearTitle: "2025-2026",
  },
  {
    studentId: 2,
    registrationId: 13,
    name: "Omar Ahmad Khalil",
    yearTitle: "2025-2026",
  },
];

export const fakeChildDetails: ParentChildDetail[] = [
  {
    studentId: 1,
    personId: 2,
    registerId: 1001,
    username: "layla.khalil",
    firstName: "Layla",
    middleName: "Ahmad",
    lastName: "Khalil",
    name: "Layla Ahmad Khalil",
    email: "layla.khalil@example.com",
    gender: 2,
    birthday: "2015-09-01T00:00:00.000Z",
    schoolId: 1,
    schoolName: "Green Valley School",
    motherName: "Maya",
    motherFamily: "Hassan",
    motherPhone: "+96170000002",
    registration: {
      id: 12,
      sectionId: 1,
      className: "4A",
      sectionTitle: "Section A",
      yearTitle: "2025-2026",
      schoolId: 1,
      schoolName: "Green Valley School",
    },
  },
  {
    studentId: 2,
    personId: 3,
    registerId: 1002,
    username: "omar.khalil",
    firstName: "Omar",
    middleName: "Ahmad",
    lastName: "Khalil",
    name: "Omar Ahmad Khalil",
    email: "omar.khalil@example.com",
    gender: 1,
    birthday: "2018-03-12T00:00:00.000Z",
    schoolId: 1,
    schoolName: "Green Valley School",
    motherName: "Maya",
    motherFamily: "Hassan",
    motherPhone: "+96170000002",
    registration: {
      id: 13,
      sectionId: 2,
      className: "1B",
      sectionTitle: "Section B",
      yearTitle: "2025-2026",
      schoolId: 1,
      schoolName: "Green Valley School",
    },
  },
];

export const fakeAnnouncements: ParentAnnouncementItem[] = [
  {
    id: 1,
    title: "School Holiday",
    content: "School will be closed on Friday for a public holiday.",
    publishedAt: "2026-08-20T08:00:00.000Z",
    isGlobal: true,
    schoolName: "Green Valley School",
    sectionName: null,
    class: null,
  },
  {
    id: 2,
    title: "Parent meeting",
    content: "Grade 4 parents meeting is scheduled for next Tuesday at 4:00 PM.",
    publishedAt: "2026-08-18T10:00:00.000Z",
    isGlobal: false,
    schoolName: "Green Valley School",
    sectionName: "A",
    class: "4",
  },
];

export const fakeStudentGrades: ParentStudentGrades[] = [
  {
    studentId: 1,
    registrationId: 12,
    studentName: "Layla Ahmad Khalil",
    schoolId: 1,
    schoolName: "Green Valley School",
    className: "4A",
    sectionName: "A",
    yearId: 1,
    yearTitle: "2025-2026",
    grades: [
      {
        id: 1,
        schoolId: 1,
        courseTitle: "Mathematics",
        gradeTypeTitle: "Midterm",
        yearId: 1,
        yearTitle: "2025-2026",
        maxGrade: 100,
        score: 86.5,
        comment: "Good work",
        publishDate: "2026-06-15T08:00:00.000Z",
      },
      {
        id: 2,
        schoolId: 1,
        courseTitle: "Science",
        gradeTypeTitle: "Quiz",
        yearId: 1,
        yearTitle: "2025-2026",
        maxGrade: 20,
        score: 18,
        comment: null,
        publishDate: "2026-08-10T08:00:00.000Z",
      },
    ],
  },
  {
    studentId: 2,
    registrationId: 13,
    studentName: "Omar Ahmad Khalil",
    schoolId: 1,
    schoolName: "Green Valley School",
    className: "1B",
    sectionName: "B",
    yearId: 1,
    yearTitle: "2025-2026",
    grades: [
      {
        id: 3,
        schoolId: 1,
        courseTitle: "Arabic",
        gradeTypeTitle: "Quiz",
        yearId: 1,
        yearTitle: "2025-2026",
        maxGrade: 20,
        score: 16,
        comment: null,
        publishDate: "2026-08-12T08:00:00.000Z",
      },
    ],
  },
];

export const fakeAbsences: ParentAttendanceAbsenceItem[] = [
  {
    studentId: 1,
    studentName: "Layla Ahmad Khalil",
    date: "2026-08-05",
    status: "absent",
    reason: "Fever",
    description: "Stayed home due to fever",
  },
];

export const fakeSchedules: ParentChildWeeklySchedule[] = [
  {
    studentId: 1,
    studentName: "Layla Ahmad Khalil",
    sectionName: "A",
    class: "4",
    schoolName: "Green Valley School",
    yearTitle: "2025-2026",
    days: [
      {
        dayName: "Monday",
        position: 1,
        courses: [
          {
            courseId: 1,
            courseTitle: "Mathematics",
            sessionName: "1st Period",
            sessionPosition: 1,
            teacherName: "Sara Ali Nasser",
            note: null,
          },
          {
            courseId: 2,
            courseTitle: "Science",
            sessionName: "2nd Period",
            sessionPosition: 2,
            teacherName: "Sara Ali Nasser",
            note: null,
          },
        ],
      },
      {
        dayName: "Tuesday",
        position: 2,
        courses: [
          {
            courseId: 3,
            courseTitle: "Arabic",
            sessionName: "1st Period",
            sessionPosition: 1,
            teacherName: "Rami Haddad",
            note: null,
          },
        ],
      },
    ],
  },
  {
    studentId: 2,
    studentName: "Omar Ahmad Khalil",
    sectionName: "B",
    class: "1",
    schoolName: "Green Valley School",
    yearTitle: "2025-2026",
    days: [
      {
        dayName: "Monday",
        position: 1,
        courses: [
          {
            courseId: 4,
            courseTitle: "English",
            sessionName: "1st Period",
            sessionPosition: 1,
            teacherName: "Nour Saleh",
            note: null,
          },
        ],
      },
    ],
  },
];

export const fakeNotices: ParentNoticeItem[] = [
  {
    id: 1,
    studentId: 1,
    studentName: "Layla Ahmad Khalil",
    description: "Please submit the medical form by Friday.",
    date: "2026-08-10",
    schoolName: "Green Valley School",
    sectionName: "A",
    class: "4",
    receivedVia: "section",
  },
];

export const fakeAgendas: ParentAgendaItem[] = [
  {
    id: 1,
    studentId: 1,
    studentName: "Layla Ahmad Khalil",
    description: "Complete exercises 1–10 on page 42.",
    agendaDate: "2026-08-26",
    time: "09:00",
    courseTitle: "Mathematics",
    imageLink: "",
    fileLink: "",
    publishedDate: "2026-08-25T08:00:00.000Z",
    schoolName: "Green Valley School",
    sectionName: "A",
    class: "4",
  },
];

export const fakeActivities: ParentActivityItem[] = [
  {
    id: 1,
    title: "Sports Day",
    content: "Annual sports day for all students.",
    date: "2026-03-15",
    image: "",
    yearTitle: "2025-2026",
    schoolName: "Green Valley School",
  },
];

export const fakeAlbums: ParentAlbumItem[] = [
  {
    id: 1,
    title: "Sports Day 2026",
    description: "Photos from the annual sports day event.",
    date: "2026-03-15",
    yearTitle: "2025-2026",
    images: [
      { id: 1, imageLink: "", caption: "Opening ceremony", position: 1 },
    ],
  },
];

export const fakeExamSchedules: ParentStudentExamSchedules[] = [
  {
    studentId: 1,
    studentName: "Layla Ahmad Khalil",
    schoolName: "Green Valley School",
    className: "4A",
    sectionName: "A",
    examSchedules: [
      {
        id: 1,
        title: "Midterm Exams 2026",
        gradeTypeTitle: "Midterm",
        yearTitle: "2025-2026",
        note: "Please arrive 15 minutes early.",
        dates: [
          {
            id: 1,
            date: "2026-06-10",
            dayName: "Wednesday",
            exams: [
              {
                id: 1,
                courseTitle: "Mathematics",
                position: 1,
                startTime: "09:00",
                duration: 90,
                note: "Bring calculator",
              },
            ],
          },
        ],
      },
    ],
  },
];

export const fakeSchools: SchoolDetails[] = [
  {
    id: 1,
    schoolId: 1,
    schoolName: "Green Valley School",
    telephone: "+961 1 234 567",
    phone: "+961 70 123 456",
    fax: "+961 1 234 568",
    address: "Main Street, Beirut, Lebanon",
    email: "info@greenvalley.edu",
    website: "https://greenvalley.edu",
    about: "Green Valley School provides quality education for all students.",
  },
];

export const fakeDashboard = {
  profile: fakeParentProfile,
  children: fakeChildren,
  childDetails: fakeChildDetails,
  announcements: fakeAnnouncements,
  grades: fakeStudentGrades,
  absences: fakeAbsences,
  schedules: fakeSchedules,
  notices: fakeNotices,
  agendas: fakeAgendas,
  activities: fakeActivities,
  albums: fakeAlbums,
  examSchedules: fakeExamSchedules,
  schools: fakeSchools,
};

export function filterByStudentId<T extends { studentId: number }>(
  items: T[],
  studentId?: number,
): T[] {
  if (!studentId) {
    return items;
  }
  return items.filter((item) => item.studentId === studentId);
}
