export type SchoolAdmin = {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  schoolName: string;
  schoolId: number;
  yearTitle: string;
};

export type SchoolStudent = {
  studentId: number;
  name: string;
  className: string;
  sectionName: string;
  parentName: string;
  status: "active" | "inactive";
};

export type SchoolTeacher = {
  teacherId: number;
  name: string;
  courses: string[];
  classNames: string[];
};

export type SchoolParentChild = {
  studentId: number;
  name: string;
  className: string;
  sectionName: string;
  status: "active" | "inactive";
};

export type SchoolParent = {
  parentId: number;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  children: SchoolParentChild[];
};

export type SchoolClass = {
  id: number;
  className: string;
  sectionName: string;
  students: number;
  teacherName: string;
};

export type SchoolScheduleRow = {
  dayName: string;
  className: string;
  sessionName: string;
  courseTitle: string;
  teacherName: string;
};

export type SchoolGradeRow = {
  id: number;
  studentName: string;
  className: string;
  courseTitle: string;
  gradeTypeTitle: string;
  score: number;
  maxGrade: number;
};

export type SchoolAbsence = {
  id: number;
  studentName: string;
  className: string;
  date: string;
  status: string;
  reason: string;
};

export type SchoolAgenda = {
  id: number;
  className: string;
  courseTitle: string;
  description: string;
  agendaDate: string;
  time: string;
  teacherName: string;
};

export type SchoolNotice = {
  id: number;
  title: string;
  audience: string;
  date: string;
  description: string;
};

export type SchoolAnnouncement = {
  id: number;
  title: string;
  audience: string;
  publishedAt: string;
  content: string;
};

export const fakeAdmin: SchoolAdmin = {
  name: "Rania Fadi Admin",
  firstName: "Rania",
  lastName: "Admin",
  email: "admin@greenvalley.edu",
  username: "admin.green",
  schoolName: "Green Valley School",
  schoolId: 1,
  yearTitle: "2025-2026",
};

export const fakeStudents: SchoolStudent[] = [
  {
    studentId: 1,
    name: "Layla Ahmad Khalil",
    className: "4A",
    sectionName: "A",
    parentName: "Ahmad Hassan Khalil",
    status: "active",
  },
  {
    studentId: 3,
    name: "Rana Maya Hassan",
    className: "4A",
    sectionName: "A",
    parentName: "Maya Joseph Hassan",
    status: "active",
  },
];

export const fakeTeachers: SchoolTeacher[] = [
  {
    teacherId: 1,
    name: "Sara Ali Nasser",
    courses: ["Mathematics", "Science"],
    classNames: ["4A"],
  },
  {
    teacherId: 2,
    name: "Rami Haddad",
    courses: ["Arabic"],
    classNames: ["4A", "1B"],
  },
];

export const fakeParents: SchoolParent[] = [
  {
    parentId: 1,
    name: "Ahmad Hassan Khalil",
    address: "Hamra Street, Beirut, Lebanon",
    phoneNumber: "+961 70 000 001",
    email: "ahmad.khalil@example.com",
    children: [
      {
        studentId: 1,
        name: "Layla Ahmad Khalil",
        className: "4A",
        sectionName: "A",
        status: "active",
      },
      {
        studentId: 2,
        name: "Omar Ahmad Khalil",
        className: "1B",
        sectionName: "B",
        status: "active",
      },
    ],
  },
  {
    parentId: 2,
    name: "Maya Joseph Hassan",
    address: "Verdun, Beirut, Lebanon",
    phoneNumber: "+961 70 000 004",
    email: "maya.hassan@example.com",
    children: [
      {
        studentId: 3,
        name: "Rana Maya Hassan",
        className: "4A",
        sectionName: "A",
        status: "active",
      },
    ],
  },
  {
    parentId: 3,
    name: "Karim Fadi Saleh",
    address: "Ashrafieh, Beirut, Lebanon",
    phoneNumber: "+961 71 445 210",
    email: "karim.saleh@example.com",
    children: [
      {
        studentId: 4,
        name: "Nour Karim Saleh",
        className: "1B",
        sectionName: "B",
        status: "active",
      },
    ],
  },
  {
    parentId: 4,
    name: "Lina Samir Haddad",
    address: "Jounieh, Mount Lebanon",
    phoneNumber: "+961 76 882 190",
    email: "lina.haddad@example.com",
    children: [
      {
        studentId: 5,
        name: "Adam Lina Haddad",
        className: "4A",
        sectionName: "A",
        status: "active",
      },
      {
        studentId: 6,
        name: "Maya Lina Haddad",
        className: "1B",
        sectionName: "B",
        status: "inactive",
      },
      {
        studentId: 7,
        name: "Sami Lina Haddad",
        className: "4A",
        sectionName: "A",
        status: "active",
      },
    ],
  },
];

export const fakeClasses: SchoolClass[] = [
  {
    id: 1,
    className: "4A",
    sectionName: "Section A",
    students: 28,
    teacherName: "Sara Ali Nasser",
  },
  {
    id: 2,
    className: "1B",
    sectionName: "Section B",
    students: 22,
    teacherName: "Nour Saleh",
  },
];

export const fakeSchoolSchedule: SchoolScheduleRow[] = [
  {
    dayName: "Monday",
    className: "4A",
    sessionName: "1st Period",
    courseTitle: "Mathematics",
    teacherName: "Sara Ali Nasser",
  },
  {
    dayName: "Monday",
    className: "4A",
    sessionName: "2nd Period",
    courseTitle: "Science",
    teacherName: "Sara Ali Nasser",
  },
  {
    dayName: "Tuesday",
    className: "4A",
    sessionName: "1st Period",
    courseTitle: "Arabic",
    teacherName: "Rami Haddad",
  },
];

export const fakeSchoolGrades: SchoolGradeRow[] = [
  {
    id: 1,
    studentName: "Layla Ahmad Khalil",
    className: "4A",
    courseTitle: "Mathematics",
    gradeTypeTitle: "Midterm",
    score: 86.5,
    maxGrade: 100,
  },
  {
    id: 2,
    studentName: "Rana Maya Hassan",
    className: "4A",
    courseTitle: "Science",
    gradeTypeTitle: "Quiz",
    score: 18,
    maxGrade: 20,
  },
];

export const fakeSchoolAbsences: SchoolAbsence[] = [
  {
    id: 1,
    studentName: "Layla Ahmad Khalil",
    className: "4A",
    date: "2026-08-05",
    status: "absent",
    reason: "Fever",
  },
];

export const fakeSchoolAgendas: SchoolAgenda[] = [
  {
    id: 1,
    className: "4A",
    courseTitle: "Mathematics",
    description: "Complete exercises 1–10 on page 42.",
    agendaDate: "2026-08-26",
    time: "09:00",
    teacherName: "Sara Ali Nasser",
  },
];

export const fakeSchoolNotices: SchoolNotice[] = [
  {
    id: 1,
    title: "Medical form",
    audience: "Class 4A",
    date: "2026-08-10",
    description: "Please submit the medical form by Friday.",
  },
];

export const fakeSchoolAnnouncements: SchoolAnnouncement[] = [
  {
    id: 1,
    title: "School Holiday",
    audience: "All school",
    publishedAt: "2026-08-20",
    content: "School will be closed on Friday for a public holiday.",
  },
  {
    id: 2,
    title: "Parent meeting",
    audience: "Class 4A",
    publishedAt: "2026-08-18",
    content: "Grade 4 parents meeting is scheduled for next Tuesday at 4:00 PM.",
  },
];

export const fakeSchoolExams = [
  {
    id: 1,
    title: "Midterm Exams 2026",
    className: "4A",
    date: "2026-06-10",
    courseTitle: "Mathematics",
    startTime: "09:00",
    duration: 90,
  },
];

export const fakeSchoolActivities = [
  {
    id: 1,
    title: "Sports Day",
    date: "2026-03-15",
    content: "Annual sports day for all students.",
  },
];

export const fakeSchoolAlbums = [
  {
    id: 1,
    title: "Sports Day 2026",
    date: "2026-03-15",
    photos: 24,
    description: "Photos from the annual sports day event.",
  },
];

export const fakeSchoolDetails = {
  schoolId: 1,
  schoolName: "Green Valley School",
  telephone: "+961 1 234 567",
  phone: "+961 70 123 456",
  fax: "+961 1 234 568",
  address: "Main Street, Beirut, Lebanon",
  email: "info@greenvalley.edu",
  website: "https://greenvalley.edu",
  about: "Green Valley School provides quality education for all students.",
  yearTitle: "2025-2026",
};

export const fakeSchoolStats = {
  students: fakeStudents.length,
  teachers: fakeTeachers.length,
  classes: fakeClasses.length,
  absences: fakeSchoolAbsences.length,
};
