import {
  BookOpen,
  Bookmark,
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
  Users,
  Presentation,
  Rows3,
  Tags,
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
          { href: "/teachers", label: "Teacher", icon: Presentation },
        ],
      },
    ],
  },
  {
    title: "Academics",
    items: [
      { href: "/classes", label: "Classes", icon: School },
      { href: "/courses", label: "Courses", icon: Library },
      { href: "/class-courses", label: "Class courses", icon: Bookmark },
      { href: "/teaches", label: "Teach", icon: BookUser },
      { href: "/section-titles", label: "Section titles", icon: Tags },
      { href: "/sections", label: "Sections", icon: Rows3 },
      { href: "/schedule", label: "Weekly schedule", icon: CalendarDays },
      { href: "/grades", label: "Grades", icon: GraduationCap },
      { href: "/exams", label: "Exam schedules", icon: BookOpen },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/attendance", label: "Attendance", icon: ClipboardList },
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
