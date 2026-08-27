"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import {
  useCreateParentMutation,
  useGetParentQuery,
  useUpdateParentMutation,
} from "@/features/school/api/parentsApi";
import {
  useGetGovernoratesQuery,
  useGetJobsQuery,
  useGetNationalitiesQuery,
  useGetRegionsQuery,
} from "@/features/school/api/lookupsApi";
import { useAppSelector } from "@/store/hooks";
import type { LookupItem, SaveParentBody } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const GENDERS = [
  { value: "", label: "Gender" },
  { value: "0", label: "Male" },
  { value: "1", label: "Female" },
];

type ParentFormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  picture: File | null;
  gender: string;
  nationalityId: string;
  registerId: string;
  governorateId: string;
  identityNumber: string;
  village: string;
  birthday: string;
  placeOfBirth: string;
  email: string;
  phoneNumber: string;
  urgentNumber: string;
  landline: string;
  jobId: string;
  regionId: string;
  address: string;
  description: string;
};

function todayInputDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function emptyForm(): ParentFormState {
  return {
    firstName: "",
    middleName: "",
    lastName: "",
    picture: null,
    gender: "",
    nationalityId: "",
    registerId: "",
    governorateId: "",
    identityNumber: "",
    village: "",
    birthday: "",
    placeOfBirth: "",
    email: "",
    phoneNumber: "",
    urgentNumber: "",
    landline: "",
    jobId: "",
    regionId: "",
    address: "",
    description: "",
  };
}

function optionalNumber(value: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function toBody(form: ParentFormState): SaveParentBody {
  const gender =
    form.gender === "0" || form.gender === "1"
      ? Number(form.gender)
      : undefined;

  return {
    firstName: form.firstName.trim(),
    middleName: form.middleName.trim() || undefined,
    lastName: form.lastName.trim(),
    gender,
    nationalityId: optionalNumber(form.nationalityId),
    registerId:
      form.registerId.trim() === ""
        ? null
        : Number.isInteger(Number(form.registerId))
          ? Number(form.registerId)
          : undefined,
    governorateId: optionalNumber(form.governorateId),
    regionId: optionalNumber(form.regionId),
    currentJobId: optionalNumber(form.jobId),
    identityNumber: form.identityNumber.trim() || undefined,
    village: form.village.trim() || undefined,
    placeOfBirth: form.placeOfBirth.trim() || undefined,
    email: form.email.trim() || undefined,
    phoneNumber: form.phoneNumber.trim(),
    urgentNumber: form.urgentNumber.trim() || undefined,
    landline: form.landline.trim() || undefined,
    address: form.address.trim() || undefined,
    description: form.description.trim() || undefined,
    birthday: form.birthday || undefined,
  };
}

function Field({
  id,
  label,
  required,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className={`block min-w-0 flex-1 ${className ?? ""}`}>
      <span className="sr-only">
        {label}
        {required ? " (required)" : ""}
      </span>
      {children}
    </label>
  );
}

function LookupSelect({
  id,
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: LookupItem[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Field id={id} label={label}>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} cursor-pointer disabled:bg-stone-50 disabled:text-muted`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={String(option.id)}>
            {option.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function ParentForm({
  parentId,
  readOnly = false,
}: {
  parentId?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const isEdit = Boolean(parentId) && !readOnly;
  const [form, setForm] = useState<ParentFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState(todayInputDate);

  const { data: parent, isLoading: parentLoading } = useGetParentQuery(
    parentId ?? 0,
    { skip: !authReady || !parentId },
  );
  const { data: nationalities = [] } = useGetNationalitiesQuery(undefined, {
    skip: !authReady,
  });
  const { data: jobs = [] } = useGetJobsQuery(undefined, { skip: !authReady });
  const { data: governorates = [] } = useGetGovernoratesQuery(undefined, {
    skip: !authReady,
  });
  const governorateId = optionalNumber(form.governorateId);
  const { data: regions = [] } = useGetRegionsQuery(
    { governorateId },
    { skip: !authReady || !governorateId },
  );

  const [createParent, createState] = useCreateParentMutation();
  const [updateParent, updateState] = useUpdateParentMutation();

  const fileName = useMemo(
    () => form.picture?.name ?? "No file chosen",
    [form.picture],
  );
  const saving = createState.isLoading || updateState.isLoading;

  useEffect(() => {
    if (isEdit || readOnly || form.nationalityId) {
      return;
    }

    const defaultNationality = nationalities.find((item) => item.isDefault);
    if (!defaultNationality) {
      return;
    }

    setForm((current) =>
      current.nationalityId
        ? current
        : { ...current, nationalityId: String(defaultNationality.id) },
    );
  }, [form.nationalityId, isEdit, nationalities, readOnly]);

  useEffect(() => {
    if (!parent) {
      return;
    }

    setForm({
      ...emptyForm(),
      firstName: parent.firstName,
      middleName: parent.middleName,
      lastName: parent.lastName,
      gender: parent.gender === null ? "" : String(parent.gender),
      nationalityId: parent.nationalityId ? String(parent.nationalityId) : "",
      registerId: parent.registerId === null ? "" : String(parent.registerId),
      governorateId: parent.governorateId ? String(parent.governorateId) : "",
      identityNumber: parent.identityNumber ?? "",
      village: parent.village ?? "",
      birthday: parent.birthday ?? "",
      placeOfBirth: parent.placeOfBirth ?? "",
      email: parent.email ?? "",
      phoneNumber: parent.phoneNumber ?? "",
      urgentNumber: parent.urgentNumber ?? "",
      landline: parent.landline ?? "",
      jobId: parent.currentJobId ? String(parent.currentJobId) : "",
      regionId: parent.regionId ? String(parent.regionId) : "",
      address: parent.address ?? "",
      description: parent.description ?? "",
    });
  }, [parent]);

  function update<K extends keyof ParentFormState>(
    key: K,
    value: ParentFormState[K],
  ) {
    setForm((current) => {
      if (key === "governorateId") {
        return { ...current, governorateId: value as string, regionId: "" };
      }
      return { ...current, [key]: value };
    });
  }

  async function onSave(stayOnPage: boolean) {
    setFormError(null);
    const body = toBody(form);

    try {
      if (parentId) {
        await updateParent({ id: parentId, body }).unwrap();
      } else {
        await createParent(body).unwrap();
      }

      if (stayOnPage && !parentId) {
        setForm(emptyForm());
        setCreatedAt(todayInputDate());
        return;
      }

      router.push("/parents");
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  }

  if (parentId && parentLoading) {
    return (
      <p className="rounded-3xl border border-border bg-white p-8 text-sm text-muted">
        Loading parent…
      </p>
    );
  }

  return (
    <form
      className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (!readOnly) {
          void onSave(false);
        }
      }}
    >
      <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-foreground">
        {readOnly ? "View Parent" : isEdit ? "Edit Parent" : "Add New Parent"}
      </h1>

      <fieldset
        disabled={readOnly}
        className="min-w-0 border-0 p-0 disabled:[&_input]:bg-stone-50 disabled:[&_select]:bg-stone-50 disabled:[&_textarea]:bg-stone-50 disabled:[&_input]:text-muted disabled:[&_select]:text-muted disabled:[&_textarea]:text-muted disabled:[&_label]:cursor-not-allowed"
      >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field id="firstName" label="First Name" required>
          <input
            id="firstName"
            required
            value={form.firstName}
            onChange={(event) => update("firstName", event.target.value)}
            placeholder="First Name*"
            className={inputClass}
          />
        </Field>
        <Field id="middleName" label="Middle Name">
          <input
            id="middleName"
            value={form.middleName}
            onChange={(event) => update("middleName", event.target.value)}
            placeholder="Middle Name"
            className={inputClass}
          />
        </Field>
        <Field id="lastName" label="Family" required>
          <input
            id="lastName"
            required
            value={form.lastName}
            onChange={(event) => update("lastName", event.target.value)}
            placeholder="Family*"
            className={inputClass}
          />
        </Field>
        <div>
          <span className="sr-only">Photo</span>
          <label className="flex h-11 cursor-pointer items-center overflow-hidden rounded-xl border border-border bg-white">
            <span className="inline-flex h-full shrink-0 items-center bg-primary-soft px-3 text-sm font-medium text-primary">
              Choose File
            </span>
            <span className="truncate px-3 text-sm text-muted">{fileName}</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) =>
                update("picture", event.target.files?.[0] ?? null)
              }
            />
          </label>
        </div>

        <Field id="gender" label="Gender">
          <select
            id="gender"
            value={form.gender}
            onChange={(event) => update("gender", event.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            {GENDERS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <LookupSelect
          id="nationalityId"
          label="Nationality"
          placeholder="Nationality / الجنسية"
          value={form.nationalityId}
          options={nationalities}
          onChange={(value) => update("nationalityId", value)}
        />
        <Field id="registerId" label="Register ID">
          <input
            id="registerId"
            type="number"
            step={1}
            value={form.registerId}
            onChange={(event) => update("registerId", event.target.value)}
            placeholder="Register ID"
            className={inputClass}
          />
        </Field>
        <Field id="identityNumber" label="Identity Number">
          <input
            id="identityNumber"
            value={form.identityNumber}
            onChange={(event) => update("identityNumber", event.target.value)}
            placeholder="Identity Number"
            className={inputClass}
          />
        </Field>
        <Field id="birthday" label="Date of Birth">
          <input
            id="birthday"
            type="date"
            value={form.birthday}
            onChange={(event) => update("birthday", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field id="placeOfBirth" label="Place of birth">
          <input
            id="placeOfBirth"
            value={form.placeOfBirth}
            onChange={(event) => update("placeOfBirth", event.target.value)}
            placeholder="Place Of birth"
            className={inputClass}
          />
        </Field>
        <Field id="email" label="Email">
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="Email"
            className={inputClass}
          />
        </Field>

        <div className="col-span-full grid gap-4 sm:grid-cols-3">
          <LookupSelect
            id="governorateId"
            label="Governorate"
            placeholder="Governorate / المحافظة"
            value={form.governorateId}
            options={governorates}
            onChange={(value) => update("governorateId", value)}
          />
          <LookupSelect
            id="regionId"
            label="Region"
            placeholder={
              governorateId ? "Region / القضاء" : "Select a governorate first"
            }
            value={form.regionId}
            options={regions}
            onChange={(value) => update("regionId", value)}
            disabled={!governorateId}
          />
          <Field id="village" label="Village">
            <input
              id="village"
              value={form.village}
              onChange={(event) => update("village", event.target.value)}
              placeholder="Village"
              className={inputClass}
            />
          </Field>
        </div>

        <Field id="phoneNumber" label="Phone number" required>
          <input
            id="phoneNumber"
            required
            value={form.phoneNumber}
            onChange={(event) => update("phoneNumber", event.target.value)}
            placeholder="Phone Number*"
            className={inputClass}
          />
        </Field>
        <Field id="urgentNumber" label="Urgent phone number">
          <input
            id="urgentNumber"
            value={form.urgentNumber}
            onChange={(event) => update("urgentNumber", event.target.value)}
            placeholder="Urgent phone Number"
            className={inputClass}
          />
        </Field>
        <Field id="landline" label="Telephone">
          <input
            id="landline"
            value={form.landline}
            onChange={(event) => update("landline", event.target.value)}
            placeholder="Telephone"
            className={inputClass}
          />
        </Field>
        <LookupSelect
          id="jobId"
          label="Job"
          placeholder="Job"
          value={form.jobId}
          options={jobs}
          onChange={(value) => update("jobId", value)}
        />
      </div>

      <div className="mt-6 space-y-4">
        <div className="grid items-center gap-3 lg:grid-cols-[7.5rem_1fr]">
          <p className="text-sm font-semibold text-primary">Address</p>
          <input
            value={form.address}
            onChange={(event) => update("address", event.target.value)}
            placeholder="Address"
            className={inputClass}
          />
        </div>

        <div className="grid items-start gap-3 lg:grid-cols-[7.5rem_1fr]">
          <p className="pt-2.5 text-sm font-semibold text-primary">
            Description
          </p>
          <textarea
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        </div>
      </div>

      {formError ? (
        <p className="mt-4 text-sm text-red-600">{formError}</p>
      ) : null}

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-lg font-semibold text-foreground">
            Date Created
          </span>
          <input
            type="date"
            value={createdAt}
            onChange={(event) => setCreatedAt(event.target.value)}
            className={`${inputClass} sm:w-48`}
          />
        </label>
        {readOnly ? null : (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setForm(emptyForm())}
            className="h-11 cursor-pointer rounded-xl bg-primary px-5 text-sm font-medium text-on-primary transition-colors duration-200 hover:bg-primary-hover"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-11 cursor-pointer rounded-xl bg-foreground px-5 text-sm font-medium text-white transition-colors duration-200 hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {isEdit ? null : (
            <button
              type="button"
              disabled={saving}
              onClick={() => void onSave(true)}
              className="h-11 cursor-pointer rounded-xl bg-primary-hover px-5 text-sm font-medium text-on-primary transition-colors duration-200 hover:opacity-90 disabled:opacity-60"
            >
              Save & new
            </button>
          )}
        </div>
        )}
      </div>
      </fieldset>
    </form>
  );
}
