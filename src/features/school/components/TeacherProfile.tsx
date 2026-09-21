"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  BookMarked,
  BookOpen,
  Cake,
  CalendarDays,
  Check,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Presentation,
  Rows3,
  Shield,
} from "lucide-react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import {
  useGetGovernoratesQuery,
  useGetNationalitiesQuery,
  useGetRegionsQuery,
} from "@/features/school/api/lookupsApi";
import { useGetTeachesQuery } from "@/features/school/api/teachesApi";
import { useGetTeacherSupervisorsQuery } from "@/features/school/api/teacherSupervisorsApi";
import { useGetTeacherQuery } from "@/features/school/api/teachersApi";
import { useAppSelector } from "@/store/hooks";
import type { DashboardTeacherDetail } from "@/features/school/types";

function fullName(teacher: DashboardTeacherDetail) {
  return [teacher.firstName, teacher.middleName, teacher.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

function initials(teacher: DashboardTeacherDetail) {
  const first = teacher.firstName?.trim().charAt(0) ?? "";
  const last = teacher.lastName?.trim().charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

function formatBirthday(value?: string | null): string {
  if (!value) {
    return "—";
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function genderLabel(gender: number | null) {
  if (gender === 0) return "Male";
  if (gender === 1) return "Female";
  return "—";
}

function lookupName(
  items: { id: number; name: string }[] | undefined,
  id: number | null,
) {
  if (!id || !items?.length) {
    return "—";
  }
  return items.find((item) => item.id === id)?.name ?? "—";
}

function Fact({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white px-4 py-3.5 transition-colors duration-200 hover:border-primary/35">
      <div className="absolute inset-y-0 left-0 w-1 bg-foreground/10 transition-colors duration-200 group-hover:bg-primary" />
      <dt className="flex items-center gap-1.5 pl-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 break-words pl-2 text-sm font-semibold text-foreground">
        {value || "—"}
      </dd>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
        {icon}
      </span>
      <div>
        <p className="text-xl font-semibold tabular-nums text-white">{value}</p>
        <p className="text-xs text-white/65">{label}</p>
      </div>
    </div>
  );
}

export function TeacherProfile({ teacherId }: { teacherId: number }) {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);

  const {
    data: teacher,
    error: teacherError,
    isLoading: teacherLoading,
  } = useGetTeacherQuery(teacherId, { skip: !canFetch });

  const {
    data: teachesData,
    error: teachesError,
    isLoading: teachesLoading,
    isFetching: teachesFetching,
  } = useGetTeachesQuery(
    {
      page: 1,
      limit: 50,
      teacherId,
      sortBy: "year",
      sortOrder: "desc",
    },
    { skip: !canFetch },
  );

  const {
    data: supervisorsData,
    error: supervisorsError,
    isLoading: supervisorsLoading,
    isFetching: supervisorsFetching,
  } = useGetTeacherSupervisorsQuery(
    {
      page: 1,
      limit: 50,
      teacherId,
      sortBy: "year",
      sortOrder: "desc",
    },
    { skip: !canFetch },
  );

  const { data: nationalities } = useGetNationalitiesQuery(undefined, {
    skip: !canFetch,
  });
  const { data: governorates } = useGetGovernoratesQuery(undefined, {
    skip: !canFetch,
  });
  const { data: regions } = useGetRegionsQuery(
    teacher?.governorateId
      ? { governorateId: teacher.governorateId }
      : undefined,
    { skip: !canFetch || !teacher?.governorateId },
  );

  if (teacherLoading) {
    return (
      <div className="rounded-3xl border border-border bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <LoadingDots label="Loading teacher profile" />
      </div>
    );
  }

  if (teacherError || !teacher) {
    return (
      <p
        className="rounded-3xl border border-border bg-white px-5 py-8 text-center text-sm text-red-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        role="alert"
      >
        {getApiErrorMessage(teacherError, "Could not load teacher profile")}
      </p>
    );
  }

  const name = fullName(teacher);
  const teaches = teachesData?.items ?? [];
  const teachesTotal = teachesData?.pagination.total ?? teaches.length;
  const currentTeaches = teaches.filter((item) => item.isCurrentYear);
  const showTeaches = currentTeaches.length > 0 ? currentTeaches : teaches;
  const uniqueClasses = new Set(showTeaches.map((item) => item.classId)).size;
  const uniqueCourses = new Set(showTeaches.map((item) => item.courseId)).size;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-[#1c1917] text-white shadow-[0_16px_40px_rgba(28,25,23,0.28)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.35),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_40%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border border-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border border-white/10"
        />

        <div className="relative flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-2xl font-bold tracking-wide text-foreground shadow-lg sm:h-24 sm:w-24 sm:text-3xl">
                  {initials(teacher)}
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-[#1c1917] ${
                    teacher.status ? "bg-emerald-500" : "bg-stone-400"
                  }`}
                  title={teacher.status ? "Active" : "Closed"}
                >
                  {teacher.status ? (
                    <Check
                      aria-hidden
                      className="h-3.5 w-3.5 text-white"
                      strokeWidth={3}
                    />
                  ) : null}
                </span>
              </div>
              <div className="min-w-0 pt-1">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  <Presentation aria-hidden className="h-3.5 w-3.5" />
                  Teacher profile
                </p>
                <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight sm:text-4xl">
                  {name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/75">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1">
                    <IdCard aria-hidden className="h-3.5 w-3.5" />
                    #{teacher.id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 ${
                      teacher.status
                        ? "bg-emerald-500/20 text-emerald-100"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {teacher.status ? "Active staff" : "Closed"}
                  </span>
                  {teacher.createdAt ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1">
                      <CalendarDays aria-hidden className="h-3.5 w-3.5" />
                      Joined {teacher.createdAt}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <Link
              href={`/teachers/${teacher.id}/edit`}
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-on-primary transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Pencil aria-hidden className="h-4 w-4" />
              Edit teacher
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat
              label="Assignments"
              value={teachesTotal}
              icon={<BookOpen aria-hidden className="h-5 w-5" />}
            />
            <Stat
              label="Classes"
              value={uniqueClasses}
              icon={<GraduationCap aria-hidden className="h-5 w-5" />}
            />
            <Stat
              label="Courses"
              value={uniqueCourses}
              icon={<BookMarked aria-hidden className="h-5 w-5" />}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[20rem_1fr]">
        <aside className="space-y-4">
          <section className="rounded-3xl border border-border bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
              Contact
            </h2>
            <ul className="mt-4 space-y-4">
              <li className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Phone aria-hidden className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Phone
                  </p>
                  <p className="mt-0.5 break-all text-sm font-semibold text-foreground">
                    {teacher.phoneNumber ?? "—"}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Mail aria-hidden className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Email
                  </p>
                  <p className="mt-0.5 break-all text-sm font-semibold text-foreground">
                    {teacher.email ?? "—"}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <MapPin aria-hidden className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Address
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {teacher.address ?? "—"}
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <section className="rounded-3xl border border-border bg-gradient-to-b from-white to-primary-soft/40 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
              More phones
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Urgent
                </dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {teacher.urgentNumber ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Landline
                </dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {teacher.landline ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Village
                </dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {teacher.village ?? "—"}
                </dd>
              </div>
            </dl>
          </section>
        </aside>

        <section className="rounded-3xl border border-border bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <IdCard aria-hidden className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Personal record
            </h2>
          </div>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Fact label="First name" value={teacher.firstName} />
            <Fact label="Middle name" value={teacher.middleName || "—"} />
            <Fact label="Family name" value={teacher.lastName} />
            <Fact label="Gender" value={genderLabel(teacher.gender)} />
            <Fact
              label="Date of birth"
              value={formatBirthday(teacher.birthday)}
              icon={<Cake aria-hidden className="h-3.5 w-3.5" />}
            />
            <Fact
              label="Place of birth"
              value={teacher.placeOfBirth ?? "—"}
            />
            <Fact
              label="Nationality"
              value={lookupName(nationalities, teacher.nationalityId)}
            />
            <Fact
              label="Governorate"
              value={lookupName(governorates, teacher.governorateId)}
            />
            <Fact
              label="Region"
              value={lookupName(regions, teacher.regionId)}
            />
            <Fact
              label="Identity number"
              value={teacher.identityNumber ?? "—"}
            />
            <Fact
              label="Register id"
              value={
                teacher.registerId != null ? String(teacher.registerId) : "—"
              }
            />
          </dl>
        </section>
      </div>

      <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-stone-50/70 px-5 py-5 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <Rows3 aria-hidden className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Teaching assignments
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted">
              {showTeaches.length} shown
              {currentTeaches.length > 0 ? " · current year first" : ""}
            </p>
          </div>
          <Link
            href="/teaches/add"
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Add teach
          </Link>
        </div>

        {teachesLoading ? (
          <div className="p-8">
            <LoadingDots label="Loading assignments" />
          </div>
        ) : teachesError ? (
          <p className="px-5 py-8 text-center text-sm text-red-600" role="alert">
            {getApiErrorMessage(teachesError, "Could not load assignments")}
          </p>
        ) : showTeaches.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Presentation aria-hidden className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">
              No teaching assignments yet
            </p>
            <p className="mt-1 text-sm text-muted">
              Assign this teacher to a class and course from Teach.
            </p>
          </div>
        ) : (
          <ul
            className={`grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 ${
              teachesFetching ? "opacity-70" : ""
            }`}
          >
            {showTeaches.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/teaches/${item.id}`}
                  className="group flex h-full cursor-pointer flex-col rounded-2xl border border-stone-200 bg-gradient-to-br from-white to-stone-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_12px_28px_rgba(28,25,23,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-white transition-colors duration-200 group-hover:bg-primary">
                      <BookMarked aria-hidden className="h-4 w-4" />
                    </span>
                    {item.isCurrentYear ? (
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                        Current
                      </span>
                    ) : (
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                        Past
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-base font-semibold text-foreground group-hover:text-primary">
                    {item.courseTitle}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {item.className}
                    {item.sectionTitle ? ` · ${item.sectionTitle}` : ""}
                  </p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-stone-400">
                    {item.yearTitle}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-stone-50/70 px-5 py-5 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <Shield aria-hidden className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Supervised classes
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted">
              {(supervisorsData?.items ?? []).reduce(
                (count, group) => count + group.classes.length,
                0,
              )}{" "}
              shown
            </p>
          </div>
          <Link
            href="/teacher-supervisors/add"
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Add supervisor
          </Link>
        </div>

        {supervisorsLoading ? (
          <div className="p-8">
            <LoadingDots label="Loading supervisor assignments" />
          </div>
        ) : supervisorsError ? (
          <p className="px-5 py-8 text-center text-sm text-red-600" role="alert">
            {getApiErrorMessage(
              supervisorsError,
              "Could not load supervisor assignments",
            )}
          </p>
        ) : (supervisorsData?.items ?? []).length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <Shield aria-hidden className="h-7 w-7" />
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">
              No supervisor assignments yet
            </p>
            <p className="mt-1 text-sm text-muted">
              Assign this teacher as supervisor of a class from Supervisors.
            </p>
          </div>
        ) : (
          <ul
            className={`grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 ${
              supervisorsFetching ? "opacity-70" : ""
            }`}
          >
            {(supervisorsData?.items ?? []).flatMap((group) =>
              group.classes.map((cls) => (
                <li key={cls.id}>
                  <Link
                    href={`/teacher-supervisors/${cls.id}`}
                    className="group flex h-full cursor-pointer flex-col rounded-2xl border border-stone-200 bg-gradient-to-br from-white to-stone-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_12px_28px_rgba(28,25,23,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-white transition-colors duration-200 group-hover:bg-primary">
                        <Shield aria-hidden className="h-4 w-4" />
                      </span>
                      {group.isCurrentYear ? (
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                          Current
                        </span>
                      ) : (
                        <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                          Past
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-base font-semibold text-foreground group-hover:text-primary">
                      {cls.className}
                    </p>
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-stone-400">
                      {group.yearTitle}
                    </p>
                  </Link>
                </li>
              )),
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
