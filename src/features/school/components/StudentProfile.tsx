"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Cake,
  Droplets,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Rows3,
  UserRound,
  Users,
} from "lucide-react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import {
  useGetBloodTypesQuery,
  useGetGovernoratesQuery,
  useGetNationalitiesQuery,
  useGetRegionsQuery,
} from "@/features/school/api/lookupsApi";
import { useGetRegistrationsQuery } from "@/features/school/api/registrationsApi";
import { useGetStudentQuery } from "@/features/school/api/studentsApi";
import { useGetYearsQuery } from "@/features/school/api/sectionsApi";
import { useAppSelector } from "@/store/hooks";
import type {
  DashboardRegistration,
  DashboardStudentDetail,
} from "@/features/school/types";

function fullName(student: DashboardStudentDetail) {
  return [student.firstName, student.middleName, student.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

function initials(student: DashboardStudentDetail) {
  const first = student.firstName?.trim().charAt(0) ?? "";
  const last = student.lastName?.trim().charAt(0) ?? "";
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

type ProgressKind = "up" | "down" | "stay" | "start";

function progressFromLevels(
  previous: number | null,
  current: number,
): ProgressKind {
  if (previous == null) {
    return "start";
  }
  if (current > previous) {
    return "up";
  }
  if (current < previous) {
    return "down";
  }
  return "stay";
}

function ProgressBadge({ kind }: { kind: ProgressKind }) {
  if (kind === "up") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
        <ArrowUp aria-hidden className="h-3 w-3" />
        Up
      </span>
    );
  }
  if (kind === "down") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
        <ArrowDown aria-hidden className="h-3 w-3" />
        Down
      </span>
    );
  }
  if (kind === "stay") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-900">
        <RefreshCw aria-hidden className="h-3 w-3" />
        Re-reg
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600">
      First
    </span>
  );
}

function sortRegistrations(items: DashboardRegistration[]) {
  return [...items].sort((a, b) => {
    const yearCmp = a.yearTitle.localeCompare(b.yearTitle);
    if (yearCmp !== 0) {
      return yearCmp;
    }
    if (a.classLevel !== b.classLevel) {
      return a.classLevel - b.classLevel;
    }
    return a.id - b.id;
  });
}

export function StudentProfile({ studentId }: { studentId: number }) {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);

  const {
    data: student,
    error: studentError,
    isLoading: studentLoading,
  } = useGetStudentQuery(studentId, { skip: !canFetch });

  const {
    data: registrationsData,
    error: registrationsError,
    isLoading: registrationsLoading,
    isFetching: registrationsFetching,
  } = useGetRegistrationsQuery(
    {
      page: 1,
      limit: 100,
      studentId,
      sortBy: "year",
      sortOrder: "asc",
    },
    { skip: !canFetch },
  );

  const { data: years = [] } = useGetYearsQuery(undefined, {
    skip: !canFetch,
  });
  const { data: nationalities } = useGetNationalitiesQuery(undefined, {
    skip: !canFetch,
  });
  const { data: bloodTypes } = useGetBloodTypesQuery(undefined, {
    skip: !canFetch,
  });
  const { data: governorates } = useGetGovernoratesQuery(undefined, {
    skip: !canFetch,
  });
  const { data: regions } = useGetRegionsQuery(
    student?.governorateId
      ? { governorateId: student.governorateId }
      : undefined,
    { skip: !canFetch || !student?.governorateId },
  );

  const registrations = useMemo(
    () => sortRegistrations(registrationsData?.items ?? []),
    [registrationsData?.items],
  );

  const timeline = useMemo(() => {
    let previousLevel: number | null = null;
    return registrations.map((item) => {
      const kind = progressFromLevels(previousLevel, item.classLevel);
      previousLevel = item.classLevel;
      return { item, kind };
    });
  }, [registrations]);

  const currentYearId = years.find((year) => year.isCurrent)?.id ?? null;
  const currentRegistration =
    registrations.find((item) => item.yearId === currentYearId) ??
    registrations[registrations.length - 1] ??
    null;
  const uniqueYears = new Set(registrations.map((item) => item.yearId)).size;
  const uniqueClasses = new Set(registrations.map((item) => item.classId)).size;

  if (studentLoading) {
    return (
      <div className="rounded-3xl border border-border bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <LoadingDots label="Loading student profile" />
      </div>
    );
  }

  if (studentError || !student) {
    return (
      <p
        className="rounded-3xl border border-border bg-white px-5 py-8 text-center text-sm text-red-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        role="alert"
      >
        {getApiErrorMessage(studentError, "Could not load student profile")}
      </p>
    );
  }

  const name = fullName(student);

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
                  {initials(student)}
                </div>
              </div>
              <div className="min-w-0 pt-1">
                <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                  <UserRound aria-hidden className="h-3.5 w-3.5" />
                  Student profile
                </p>
                <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight sm:text-4xl">
                  {name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/75">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1">
                    <IdCard aria-hidden className="h-3.5 w-3.5" />
                    #{student.id}
                  </span>
                  {currentRegistration ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/25 px-2.5 py-1 text-orange-100">
                      <GraduationCap aria-hidden className="h-3.5 w-3.5" />
                      {currentRegistration.className}
                      {currentRegistration.sectionTitle
                        ? ` · ${currentRegistration.sectionTitle}`
                        : ""}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1">
                      Not registered
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              href={`/students/${student.id}/edit`}
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-on-primary transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Pencil aria-hidden className="h-4 w-4" />
              Edit student
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat
              label="Registrations"
              value={registrationsData?.pagination.total ?? registrations.length}
              icon={<Rows3 aria-hidden className="h-5 w-5" />}
            />
            <Stat
              label="School years"
              value={uniqueYears}
              icon={<GraduationCap aria-hidden className="h-5 w-5" />}
            />
            <Stat
              label="Classes"
              value={uniqueClasses}
              icon={<Users aria-hidden className="h-5 w-5" />}
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
                    {student.phoneNumber || "—"}
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
                    {student.email || "—"}
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
                    {[student.address, student.village]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <section className="rounded-3xl border border-border bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
              Family
            </h2>
            <ul className="mt-4 space-y-4">
              <li>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Parent
                </p>
                <Link
                  href={`/parents/${student.parentId}`}
                  className="mt-1 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary underline-offset-2 hover:underline"
                >
                  {student.parentName}
                  <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                </Link>
              </li>
              <li>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Mother
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {[student.motherName, student.motherFamily]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </p>
                {student.motherPhone ? (
                  <p className="mt-0.5 text-sm text-muted">{student.motherPhone}</p>
                ) : null}
              </li>
            </ul>
          </section>
        </aside>

        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
              Personal information
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Fact
                label="Birthday"
                value={formatBirthday(student.birthday)}
                icon={<Cake aria-hidden className="h-3 w-3" />}
              />
              <Fact label="Gender" value={genderLabel(student.gender)} />
              <Fact
                label="Nationality"
                value={lookupName(nationalities, student.nationalityId)}
              />
              <Fact
                label="Blood type"
                value={lookupName(bloodTypes, student.bloodTypeId)}
                icon={<Droplets aria-hidden className="h-3 w-3" />}
              />
              <Fact
                label="Governorate"
                value={lookupName(governorates, student.governorateId)}
              />
              <Fact
                label="Region"
                value={lookupName(regions, student.regionId)}
              />
              <Fact
                label="Place of birth"
                value={student.placeOfBirth || "—"}
              />
              <Fact
                label="Identity number"
                value={student.identityNumber || "—"}
              />
            </dl>
          </section>

          <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-stone-50/70 px-5 py-5 sm:px-6">
              <div>
                <div className="flex items-center gap-2">
                  <GraduationCap aria-hidden className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Registration history
                  </h2>
                </div>
                <p className="mt-1 text-sm text-muted">
                  All enrollments by year, with class progression
                </p>
              </div>
              <Link
                href="/registrations"
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Open registrations
              </Link>
            </div>

            {registrationsLoading ? (
              <div className="p-8">
                <LoadingDots label="Loading registrations" />
              </div>
            ) : registrationsError ? (
              <p
                className="px-5 py-8 text-center text-sm text-red-600"
                role="alert"
              >
                {getApiErrorMessage(
                  registrationsError,
                  "Could not load registrations",
                )}
              </p>
            ) : timeline.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                  <GraduationCap aria-hidden className="h-7 w-7" />
                </div>
                <p className="mt-4 text-sm font-medium text-foreground">
                  No registrations yet
                </p>
                <p className="mt-1 text-sm text-muted">
                  Register this student into a class section to start history.
                </p>
              </div>
            ) : (
              <ol
                className={`relative space-y-0 px-5 py-6 sm:px-8 ${registrationsFetching ? "opacity-70" : ""}`}
              >
                {timeline.map(({ item, kind }, index) => {
                  const isCurrent = item.yearId === currentYearId;
                  const isLast = index === timeline.length - 1;
                  return (
                    <li key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
                      {!isLast ? (
                        <span
                          aria-hidden
                          className="absolute left-[15px] top-8 bottom-0 w-px bg-stone-200"
                        />
                      ) : null}
                      <span
                        className={`relative z-[1] mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${
                          isCurrent
                            ? "bg-primary text-on-primary"
                            : "bg-foreground text-white"
                        }`}
                      >
                        {kind === "up" ? (
                          <ArrowUp aria-hidden className="h-4 w-4" />
                        ) : kind === "down" ? (
                          <ArrowDown aria-hidden className="h-4 w-4" />
                        ) : kind === "stay" ? (
                          <RefreshCw aria-hidden className="h-4 w-4" />
                        ) : (
                          <GraduationCap aria-hidden className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1 rounded-2xl border border-stone-200 bg-gradient-to-br from-white to-stone-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                              {item.yearTitle}
                            </p>
                            <Link
                              href={`/classes/${item.classId}`}
                              className="mt-1 inline-flex cursor-pointer text-base font-semibold text-foreground hover:text-primary"
                            >
                              {item.className}
                              <span className="ms-2 text-sm font-medium text-muted">
                                Level {item.classLevel}
                              </span>
                            </Link>
                            <p className="mt-1 text-sm text-muted">
                              Section {item.sectionTitle}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <ProgressBadge kind={kind} />
                            {isCurrent ? (
                              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                                Current year
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {index > 0 ? (
                          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                            From
                            <span className="font-medium text-foreground">
                              {timeline[index - 1].item.className}
                            </span>
                            <ArrowRight aria-hidden className="h-3 w-3" />
                            <span className="font-medium text-foreground">
                              {item.className}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
