import {
  BookOpen,
  Bookmark,
  BookMarked,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Images,
  LayoutDashboard,
  Library,
  Megaphone,
  School,
  ScrollText,
  Sparkles,
  Bell,
  BookUser,
  UserRound,
  UserPlus,
  Users,
  Presentation,
  Rows3,
  Tags,
  ListOrdered,
  FileSpreadsheet,
  FileDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href?: string;
  label: string;
  icon: LucideIcon;
  children?: NavItem[];
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    title: "Home",
    items: [
      { href: "/overview", label: "Overview", icon: LayoutDashboard },
      {
        label: "Person",
        icon: Users,
        children: [
          { href: "/parents", label: "Parent", icon: UserRound },
          { href: "/students", label: "Student", icon: GraduationCap },
          { href: "/registrations", label: "Registration", icon: UserPlus },
          { href: "/teachers", label: "Teacher", icon: Presentation },
        ],
      },
    ],
  },
  {
    title: "Academics",
    items: [
      { href: "/class-courses", label: "Classes & Courses", icon: Bookmark },
      { href: "/teaches", label: "Teach", icon: BookUser },
      { href: "/section-titles", label: "Section titles", icon: Tags },
      { href: "/sections", label: "Sections", icon: Rows3 },
      { href: "/schedule", label: "Weekly schedule", icon: CalendarDays },
      {
        label: "Grades",
        icon: GraduationCap,
        children: [
          {
            href: "/grades/by-course",
            label: "Grade by course",
            icon: BookMarked,
          },
          {
            href: "/grades/by-type",
            label: "Grade by type",
            icon: ListOrdered,
          },
          {
            href: "/grade-forms",
            label: "Grade form",
            icon: FileSpreadsheet,
          },
          {
            href: "/export-grade-card",
            label: "Export grade card",
            icon: FileDown,
          },
        ],
      },
      { href: "/exams", label: "Exam schedules", icon: BookOpen },
      { href: "/courses", label: "Courses", icon: Library },
      { href: "/classes", label: "Classes", icon: School },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Attendance",
        icon: ClipboardList,
        children: [
          { href: "/attendance", label: "Attendance", icon: ClipboardList },
          { href: "/attendance/reasons", label: "Reason", icon: Tags },
        ],
      },
      { href: "/agenda", label: "Agenda", icon: ScrollText },
      { href: "/notices", label: "Notices", icon: Bell },
    ],
  },
  {
    title: "School",
    items: [
      { href: "/announcements", label: "Announcements", icon: Megaphone },
      { href: "/activities", label: "Activities", icon: Sparkles },
      { href: "/albums", label: "Albums", icon: Images },
      { href: "/school", label: "School details", icon: School },
    ],
  },
];
