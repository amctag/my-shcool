"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Baby,
  Cake,
  Check,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  User,
} from "lucide-react";
import { LoadingDots } from "@/components/dashboard/TableLoading";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady, selectAccessToken } from "@/features/auth/authSlice";
import { useGetChildrenQuery } from "@/features/school/api/childrenApi";
import {
  useGetGovernoratesQuery,
  useGetJobsQuery,
  useGetNationalitiesQuery,
  useGetRegionsQuery,
} from "@/features/school/api/lookupsApi";
import { useGetParentQuery } from "@/features/school/api/parentsApi";
import { useAppSelector } from "@/store/hooks";
import type { DashboardParentDetail } from "@/features/school/types";

function fullName(parent: DashboardParentDetail) {
  return [parent.firstName, parent.middleName, parent.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
}

function initials(parent: DashboardParentDetail) {
  const first = parent.firstName?.trim().charAt(0) ?? "";
  const last = parent.lastName?.trim().charAt(0) ?? "";
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

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-border/60">
      <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm font-medium text-foreground">
        {value || "—"}
      </dd>
    </div>
  );
}

export function ParentProfile({ parentId }: { parentId: number }) {
  const ready = useAppSelector(selectAuthReady);
  const accessToken = useAppSelector(selectAccessToken);
  const canFetch = ready && Boolean(accessToken);

  const {
    data: parent,
    error: parentError,
    isLoading: parentLoading,
  } = useGetParentQuery(parentId, { skip: !canFetch });

  const {
    data: childrenData,
    error: childrenError,
    isLoading: childrenLoading,
    isFetching: childrenFetching,
  } = useGetChildrenQuery(
    { parentId, page: 1, limit: 50 },
    { skip: !canFetch },
  );

  const { data: nationalities } = useGetNationalitiesQuery(undefined, {
    skip: !canFetch,
  });
  const { data: governorates } = useGetGovernoratesQuery(undefined, {
    skip: !canFetch,
  });
  const { data: jobs } = useGetJobsQuery(undefined, { skip: !canFetch });
  const { data: regions } = useGetRegionsQuery(
    parent?.governorateId
      ? { governorateId: parent.governorateId }
      : undefined,
    { skip: !canFetch || !parent?.governorateId },
  );

  if (parentLoading) {
    return (
      <div className="rounded-3xl bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <LoadingDots label="Loading parent profile" />
      </div>
    );
  }

  if (parentError || !parent) {
    return (
      <p className="rounded-2xl bg-white px-5 py-8 text-center text-sm text-red-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" role="alert">
        {getApiErrorMessage(parentError, "Could not load parent profile")}
      </p>
    );
  }

  const name = fullName(parent);
  const children = childrenData?.items ?? [];
  const childrenTotal =
    childrenData?.pagination.total ?? children.length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary-hover text-on-primary shadow-[0_12px_40px_rgba(234,88,12,0.25)]">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex min-w-0 items-center gap-4 sm:gap-5">
            <div className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/20 text-2xl font-bold tracking-wide ring-4 ring-white/30 backdrop-blur-sm sm:h-24 sm:w-24 sm:text-3xl">
              {initials(parent)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                Parent profile
              </p>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                {name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    parent.status
                      ? "bg-emerald-500/20 text-white"
                      : "bg-black/20 text-white/90"
                  }`}
                >
                  {parent.status ? (
                    <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : null}
                  {parent.status ? "Active" : "Closed"}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    parent.paid
                      ? "bg-white/20 text-white"
                      : "bg-black/20 text-white/80"
                  }`}
                >
                  {parent.paid ? "Paid" : "Unpaid"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                  <Baby aria-hidden className="h-3.5 w-3.5" />
                  {childrenTotal}{" "}
                  {childrenTotal === 1 ? "child" : "children"}
                </span>
              </div>
            </div>
          </div>
          <Link
            href={`/parents/${parent.id}/edit`}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-primary transition-colors duration-200 hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Pencil aria-hidden className="h-4 w-4" />
            Edit parent
          </Link>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8">
        <div className="mb-5 flex items-center gap-2">
          <User aria-hidden className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Personal details
          </h2>
        </div>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <InfoItem label="First name" value={parent.firstName} />
          <InfoItem label="Middle name" value={parent.middleName || "—"} />
          <InfoItem label="Family name" value={parent.lastName} />
          <InfoItem label="Gender" value={genderLabel(parent.gender)} />
          <InfoItem
            label="Date of birth"
            value={formatBirthday(parent.birthday)}
            icon={<Cake aria-hidden className="h-3.5 w-3.5" />}
          />
          <InfoItem
            label="Place of birth"
            value={parent.placeOfBirth ?? "—"}
          />
          <InfoItem
            label="Nationality"
            value={lookupName(nationalities, parent.nationalityId)}
          />
          <InfoItem
            label="Governorate"
            value={lookupName(governorates, parent.governorateId)}
          />
          <InfoItem
            label="Region"
            value={lookupName(regions, parent.regionId)}
          />
          <InfoItem
            label="Identity number"
            value={parent.identityNumber ?? "—"}
          />
          <InfoItem
            label="Register id"
            value={
              parent.registerId != null ? String(parent.registerId) : "—"
            }
          />
          <InfoItem
            label="Current job"
            value={lookupName(jobs, parent.currentJobId)}
          />
        </dl>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8">
        <div className="mb-5 flex items-center gap-2">
          <Phone aria-hidden className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Contact & location
          </h2>
        </div>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <InfoItem
            label="Phone"
            value={parent.phoneNumber ?? "—"}
            icon={<Phone aria-hidden className="h-3.5 w-3.5" />}
          />
          <InfoItem
            label="Urgent number"
            value={parent.urgentNumber ?? "—"}
          />
          <InfoItem label="Landline" value={parent.landline ?? "—"} />
          <InfoItem
            label="Email"
            value={parent.email ?? "—"}
            icon={<Mail aria-hidden className="h-3.5 w-3.5" />}
          />
          <InfoItem
            label="Address"
            value={parent.address ?? "—"}
            icon={<MapPin aria-hidden className="h-3.5 w-3.5" />}
          />
          <InfoItem label="Village" value={parent.village ?? "—"} />
        </dl>
        {parent.description?.trim() ? (
          <div className="mt-4 rounded-2xl bg-primary-soft/60 px-4 py-3 ring-1 ring-border/60">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Notes
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">
              {parent.description}
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:p-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap aria-hidden className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Children in school
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted">
              {childrenTotal}{" "}
              {childrenTotal === 1 ? "child linked" : "children linked"} to this
              parent
            </p>
          </div>
        </div>

        {childrenLoading ? (
          <LoadingDots label="Loading children" />
        ) : childrenError ? (
          <p className="py-8 text-center text-sm text-red-600" role="alert">
            {getApiErrorMessage(childrenError, "Could not load children")}
          </p>
        ) : children.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-primary-soft/40 px-5 py-12 text-center">
            <Baby
              aria-hidden
              className="mx-auto h-10 w-10 text-primary/70"
            />
            <p className="mt-3 text-sm font-medium text-foreground">
              No children in this school yet
            </p>
            <p className="mt-1 text-sm text-muted">
              Students linked to this parent will appear here.
            </p>
          </div>
        ) : (
          <ul
            className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${
              childrenFetching ? "opacity-70" : ""
            }`}
          >
            {children.map((child) => {
              const childFirst =
                child.firstName?.trim().charAt(0)?.toUpperCase() ?? "";
              const childLast =
                child.lastName?.trim().charAt(0)?.toUpperCase() ?? "";
              const childInitials =
                `${childFirst}${childLast}` ||
                child.fullName.trim().charAt(0).toUpperCase() ||
                "?";

              return (
                <li key={child.id}>
                  <Link
                    href={`/students/${child.id}/edit`}
                    className="group flex h-full cursor-pointer items-start gap-4 rounded-2xl border border-border bg-gradient-to-br from-white to-primary-soft/40 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_10px_28px_rgba(234,88,12,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold tracking-wide text-on-primary shadow-sm transition-transform duration-200 group-hover:scale-105">
                      {childInitials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="truncate text-base font-semibold text-foreground group-hover:text-primary">
                          {child.fullName}
                        </span>
                        <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-muted ring-1 ring-border">
                          #{child.id}
                        </span>
                      </span>
                      <span className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-border">
                          <GraduationCap aria-hidden className="h-3.5 w-3.5 text-primary" />
                          {child.className ?? "No class"}
                          {child.sectionName ? ` · ${child.sectionName}` : ""}
                        </span>
                        {child.yearTitle ? (
                          <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 ring-1 ring-border">
                            {child.yearTitle}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-border">
                          <Cake aria-hidden className="h-3.5 w-3.5 text-primary" />
                          {formatBirthday(child.birthday)}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
