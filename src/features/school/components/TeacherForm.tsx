"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import {
  useCreateTeacherMutation,
  useGetTeacherQuery,
  useUpdateTeacherMutation,
} from "@/features/school/api/teachersApi";
import {
  useGetGovernoratesQuery,
  useGetNationalitiesQuery,
  useGetRegionsQuery,
} from "@/features/school/api/lookupsApi";
import { useAppSelector } from "@/store/hooks";
import type { LookupItem, SaveTeacherBody } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const GENDERS = [
  { value: "", label: "Gender" },
  { value: "0", label: "Male" },
  { value: "1", label: "Female" },
];

type TeacherFormState = {
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
  regionId: string;
  address: string;
};

function todayInputDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function emptyForm(): TeacherFormState {
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
    regionId: "",
    address: "",
  };
}

function optionalNumber(value: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function toBody(form: TeacherFormState): SaveTeacherBody {
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
    identityNumber: form.identityNumber.trim() || undefined,
    village: form.village.trim() || undefined,
    placeOfBirth: form.placeOfBirth.trim() || undefined,
    email: form.email.trim() || undefined,
    phoneNumber: form.phoneNumber.trim(),
    urgentNumber: form.urgentNumber.trim() || undefined,
    landline: form.landline.trim() || undefined,
    address: form.address.trim() || undefined,
    birthday: form.birthday || undefined,
  };
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={id} className="block min-w-0 flex-1">
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

export function TeacherForm({
  teacherId,
  readOnly = false,
}: {
  teacherId?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const isEdit = Boolean(teacherId) && !readOnly;
  const [form, setForm] = useState<TeacherFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState(todayInputDate);

  const { data: teacher, isLoading: teacherLoading } = useGetTeacherQuery(
    teacherId ?? 0,
    { skip: !authReady || !teacherId },
  );
  const { data: nationalities = [] } = useGetNationalitiesQuery(undefined, {
    skip: !authReady,
  });
  const { data: governorates = [] } = useGetGovernoratesQuery(undefined, {
    skip: !authReady,
  });
  const governorateId = optionalNumber(form.governorateId);
  const { data: regions = [] } = useGetRegionsQuery(
    { governorateId },
    { skip: !authReady || !governorateId },
  );

  const [createTeacher, createState] = useCreateTeacherMutation();
  const [updateTeacher, updateState] = useUpdateTeacherMutation();

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
    if (!teacher) {
      return;
    }

    setForm({
      ...emptyForm(),
      firstName: teacher.firstName,
      middleName: teacher.middleName,
      lastName: teacher.lastName,
      gender: teacher.gender === null ? "" : String(teacher.gender),
      nationalityId: teacher.nationalityId ? String(teacher.nationalityId) : "",
      registerId: teacher.registerId === null ? "" : String(teacher.registerId),
      governorateId: teacher.governorateId ? String(teacher.governorateId) : "",
      identityNumber: teacher.identityNumber ?? "",
      village: teacher.village ?? "",
      birthday: teacher.birthday ?? "",
      placeOfBirth: teacher.placeOfBirth ?? "",
      email: teacher.email ?? "",
      phoneNumber: teacher.phoneNumber ?? "",
      urgentNumber: teacher.urgentNumber ?? "",
      landline: teacher.landline ?? "",
      regionId: teacher.regionId ? String(teacher.regionId) : "",
      address: teacher.address ?? "",
    });
  }, [teacher]);

  function update<K extends keyof TeacherFormState>(
    key: K,
    value: TeacherFormState[K],
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
      if (teacherId) {
        await updateTeacher({ id: teacherId, body }).unwrap();
      } else {
        await createTeacher(body).unwrap();
      }

      if (stayOnPage && !teacherId) {
        setForm(emptyForm());
        setCreatedAt(todayInputDate());
        return;
      }

      router.push("/teachers");
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  }

  if (teacherId && teacherLoading) {
    return (
      <p className="rounded-3xl border border-border bg-white p-8 text-sm text-muted">
        Loading teacher…
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
        {readOnly ? "View Teacher" : isEdit ? "Edit Teacher" : "Add New Teacher"}
      </h1>

      <fieldset
        disabled={readOnly}
        className="min-w-0 border-0 p-0 disabled:[&_input]:bg-stone-50 disabled:[&_select]:bg-stone-50 disabled:[&_input]:text-muted disabled:[&_select]:text-muted disabled:[&_label]:cursor-not-allowed"
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
            <label
              className={`flex h-11 items-center overflow-hidden rounded-xl border border-border bg-white ${
                readOnly ? "cursor-not-allowed bg-stone-50" : "cursor-pointer"
              }`}
            >
              <span className="inline-flex h-full shrink-0 items-center bg-primary-soft px-3 text-sm font-medium text-primary">
                Choose File
              </span>
              <span className="truncate px-3 text-sm text-muted">{fileName}</span>
              <input
                type="file"
                accept="image/*"
                disabled={readOnly}
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
        </div>

        <div className="mt-6 grid items-center gap-3 lg:grid-cols-[7.5rem_1fr]">
          <p className="text-sm font-semibold text-primary">Address</p>
          <input
            value={form.address}
            onChange={(event) => update("address", event.target.value)}
            placeholder="Address"
            className={inputClass}
          />
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
