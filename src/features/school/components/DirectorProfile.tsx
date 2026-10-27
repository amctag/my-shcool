"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Cake,
  CalendarDays,
  Check,
  IdCard,
  Link2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  School,
  UserCog,
} from "lucide-react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import {
  useGetGovernoratesQuery,
  useGetNationalitiesQuery,
  useGetRegionsQuery,
} from "@/features/school/api/lookupsApi";
import { useGetDirectorQuery } from "@/features/school/api/directorsApi";
import { useAppSelector } from "@/store/hooks";
import type { DashboardDirectorDetail } from "@/features/school/types";

function fullName(director: DashboardDirectorDetail) {
  return [director.firstName, director.middleName, director.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

function initials(director: DashboardDirectorDetail) {
  const first = director.firstName?.trim().charAt(0) ?? "";
  const last = director.lastName?.trim().charAt(0) ?? "";
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

export function DirectorProfile({ directorId }: { directorId: number }) {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);

  const {
    data: director,
    error: directorError,
    isLoading: directorLoading,
  } = useGetDirectorQuery(directorId, { skip: !canFetch });

  const { data: nationalities } = useGetNationalitiesQuery(undefined, {
    skip: !canFetch,
  });
  const { data: governorates } = useGetGovernoratesQuery(undefined, {
    skip: !canFetch,
  });
  const { data: regions } = useGetRegionsQuery(
    director?.governorateId
      ? { governorateId: director.governorateId }
      : undefined,
    { skip: !canFetch || !director?.governorateId },
  );

  if (directorLoading) {
    return (
      <div className="rounded-3xl border border-border bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <LoadingDots label="Loading director profile" />
      </div>
    );
  }

  if (directorError || !director) {
    return (
      <p
        className="rounded-3xl border border-border bg-white px-5 py-8 text-center text-sm text-red-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        role="alert"
      >
        {getApiErrorMessage(directorError, "Could not load director profile")}
      </p>
    );
  }

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

        <div className="relative flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <div className="relative shrink-0">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-2xl font-bold tracking-wide text-foreground shadow-lg sm:h-24 sm:w-24 sm:text-3xl">
                  {initials(director)}
                </div>
                <span
                  className={`absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-[#1c1917] ${
                    director.status ? "bg-emerald-500" : "bg-stone-400"
                  }`}
                  title={director.status ? "Active" : "Closed"}
                >
                  {director.status ? (
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
                  <UserCog aria-hidden className="h-3.5 w-3.5" />
                  Director profile
                </p>
                <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight sm:text-4xl">
                  {fullName(director)}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/75">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1">
                    <IdCard aria-hidden className="h-3.5 w-3.5" />
                    Director #{director.directorId}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1">
                    <Link2 aria-hidden className="h-3.5 w-3.5" />
                    Person #{director.personId}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 ${
                      director.status
                        ? "bg-emerald-500/20 text-emerald-100"
                        : "bg-white/10 text-white/70"
                    }`}
                  >
                    {director.status ? "Active" : "Closed"}
                  </span>
                  {director.createdAt ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1">
                      <CalendarDays aria-hidden className="h-3.5 w-3.5" />
                      Joined {director.createdAt}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <Link
              href={`/directors/${director.id}/edit`}
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-on-primary transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Pencil aria-hidden className="h-4 w-4" />
              Edit director
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
                <School aria-hidden className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">
                  {director.schoolName}
                </p>
                <p className="text-xs text-white/65">Assigned school</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
                <Phone aria-hidden className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">
                  {director.phoneNumber ?? "—"}
                </p>
                <p className="text-xs text-white/65">Primary phone</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
                <Mail aria-hidden className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">
                  {director.email ?? "—"}
                </p>
                <p className="text-xs text-white/65">Email</p>
              </div>
            </div>
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
                    {director.phoneNumber ?? "—"}
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
                    {director.email ?? "—"}
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
                    {director.address ?? "—"}
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
                  {director.urgentNumber ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Landline
                </dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {director.landline ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Village
                </dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {director.village ?? "—"}
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
            <Fact label="First name" value={director.firstName} />
            <Fact label="Middle name" value={director.middleName || "—"} />
            <Fact label="Family name" value={director.lastName} />
            <Fact label="Gender" value={genderLabel(director.gender)} />
            <Fact
              label="Date of birth"
              value={formatBirthday(director.birthday)}
              icon={<Cake aria-hidden className="h-3.5 w-3.5" />}
            />
            <Fact label="Place of birth" value={director.placeOfBirth ?? "—"} />
            <Fact
              label="Nationality"
              value={lookupName(nationalities, director.nationalityId)}
            />
            <Fact
              label="Governorate"
              value={lookupName(governorates, director.governorateId)}
            />
            <Fact
              label="Region"
              value={lookupName(regions, director.regionId)}
            />
            <Fact
              label="Identity number"
              value={director.identityNumber ?? "—"}
            />
            <Fact
              label="Register id"
              value={
                director.registerId != null ? String(director.registerId) : "—"
              }
            />
            <Fact
              label="School access"
              value={director.isActiveInSchool ? "Active in school" : "Inactive"}
            />
          </dl>
        </section>
      </div>
    </div>
  );
}
