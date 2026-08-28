export const apiTagTypes = [
  "Parent",
  "Child",
  "Announcement",
  "Schedule",
  "Grade",
  "Attendance",
  "Notice",
  "Agenda",
  "Album",
  "Activity",
  "ExamSchedule",
  "School",
  "Parents",
  "Students",
  "Lookups",
  "Teachers",
  "Classes",
  "Sections",
] as const;

export type ApiTagType = (typeof apiTagTypes)[number];
