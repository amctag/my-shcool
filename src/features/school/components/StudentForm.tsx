"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { selectAuthReady } from "@/features/auth/authSlice";
import {
  useGetParentOptionsQuery,
  useGetParentQuery,
} from "@/features/school/api/parentsApi";
import {
  useCreateStudentMutation,
  useGetStudentQuery,
  useUpdateStudentMutation,
} from "@/features/school/api/studentsApi";
import {
  useGetBloodTypesQuery,
  useGetGovernoratesQuery,
  useGetNationalitiesQuery,
  useGetRegionsQuery,
} from "@/features/school/api/lookupsApi";
import { useAppSelector } from "@/store/hooks";
import type { LookupItem, SaveStudentBody } from "@/features/school/types";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const GENDERS = [
  { value: "", label: "Gender" },
  { value: "0", label: "Male" },
  { value: "1", label: "Female" },
];

type StudentFormState = {
  parentId: string;
  firstName: string;
  picture: File | null;
  gender: string;
  nationalityId: string;
  bloodTypeId: string;
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
  motherName: string;
  motherFamily: string;
  motherPhone: string;
};

function todayInputDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function emptyForm(): StudentFormState {
  return {
    parentId: "",
    firstName: "",
    picture: null,
    gender: "",
    nationalityId: "",
    bloodTypeId: "",
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
    motherName: "",
    motherFamily: "",
    motherPhone: "",
  };
}

function optionalNumber(value: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function toBody(form: StudentFormState): SaveStudentBody {
  const gender =
    form.gender === "0" || form.gender === "1"
      ? Number(form.gender)
      : undefined;
  const parentId = optionalNumber(form.parentId);
  if (!parentId) {
    throw new Error("Select a parent");
  }

  return {
    parentId,
    firstName: form.firstName.trim(),
    gender,
    nationalityId: optionalNumber(form.nationalityId),
    bloodTypeId: optionalNumber(form.bloodTypeId),
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
    phoneNumber: form.phoneNumber.trim() || undefined,
    landline: form.landline.trim() || undefined,
    address: form.address.trim() || undefined,
    birthday: form.birthday || undefined,
    motherName: form.motherName.trim() || undefined,
    motherFamily: form.motherFamily.trim() || undefined,
    motherPhone: form.motherPhone.trim() || undefined,
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

export function StudentForm({
  studentId,
  initialParentId,
}: {
  studentId?: number;
  initialParentId?: number;
}) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const isEdit = Boolean(studentId);
  const [form, setForm] = useState<StudentFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState(todayInputDate);

  const { data: student, isLoading: studentLoading } = useGetStudentQuery(
    studentId ?? 0,
    { skip: !authReady || !studentId },
  );
  const { data: parentOptions = [] } = useGetParentOptionsQuery(undefined, {
    skip: !authReady,
  });
  const selectedParentId = optionalNumber(form.parentId);
  const { data: selectedParent } = useGetParentQuery(selectedParentId ?? 0, {
    skip: !authReady || !selectedParentId,
  });
  const { data: nationalities = [] } = useGetNationalitiesQuery(undefined, {
    skip: !authReady,
  });
  const { data: bloodTypes = [] } = useGetBloodTypesQuery(undefined, {
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

  const appliedParentId = useRef<number | null>(null);
  const [createStudent, createState] = useCreateStudentMutation();
  const [updateStudent, updateState] = useUpdateStudentMutation();

  const fileName = useMemo(
    () => form.picture?.name ?? "No file chosen",
    [form.picture],
  );
  const saving = createState.isLoading || updateState.isLoading;

  useEffect(() => {
    if (studentId || !initialParentId) {
      return;
    }

    setForm((current) =>
      current.parentId
        ? current
        : { ...current, parentId: String(initialParentId) },
    );
  }, [initialParentId, studentId]);

  useEffect(() => {
    if (!student) {
      return;
    }

    appliedParentId.current = student.parentId;
    setForm({
      ...emptyForm(),
      parentId: String(student.parentId),
      firstName: student.firstName,
      gender: student.gender === null ? "" : String(student.gender),
      nationalityId: student.nationalityId ? String(student.nationalityId) : "",
      bloodTypeId: student.bloodTypeId ? String(student.bloodTypeId) : "",
      registerId: student.registerId === null ? "" : String(student.registerId),
      governorateId: student.governorateId ? String(student.governorateId) : "",
      identityNumber: student.identityNumber ?? "",
      village: student.village ?? "",
      birthday: student.birthday ?? "",
      placeOfBirth: student.placeOfBirth ?? "",
      email: student.email ?? "",
      phoneNumber: student.phoneNumber ?? "",
      urgentNumber: student.urgentNumber ?? "",
      landline: student.landline ?? "",
      regionId: student.regionId ? String(student.regionId) : "",
      address: student.address ?? "",
      motherName: student.motherName ?? "",
      motherFamily: student.motherFamily ?? "",
      motherPhone: student.motherPhone ?? "",
    });
  }, [student]);

  useEffect(() => {
    if (!selectedParent) {
      return;
    }

    if (appliedParentId.current === selectedParent.id) {
      setForm((current) => ({
        ...current,
        urgentNumber: selectedParent.urgentNumber ?? "",
      }));
      return;
    }

    appliedParentId.current = selectedParent.id;
    setForm((current) => ({
      ...current,
      nationalityId: selectedParent.nationalityId
        ? String(selectedParent.nationalityId)
        : current.nationalityId,
      governorateId: selectedParent.governorateId
        ? String(selectedParent.governorateId)
        : current.governorateId,
      regionId: selectedParent.regionId
        ? String(selectedParent.regionId)
        : current.regionId,
      village: selectedParent.village ?? current.village,
      phoneNumber: current.phoneNumber || selectedParent.phoneNumber || "",
      urgentNumber: selectedParent.urgentNumber ?? "",
      landline: current.landline || selectedParent.landline || "",
    }));
  }, [selectedParent]);

  function update<K extends keyof StudentFormState>(
    key: K,
    value: StudentFormState[K],
  ) {
    setForm((current) => {
      if (key === "governorateId") {
        return { ...current, governorateId: value as string, regionId: "" };
      }
      if (key === "parentId") {
        appliedParentId.current = null;
        return { ...current, parentId: value as string, urgentNumber: "" };
      }
      return { ...current, [key]: value };
    });
  }

  async function onSave(stayOnPage: boolean) {
    setFormError(null);

    try {
      const body = toBody(form);
      if (studentId) {
        await updateStudent({ id: studentId, body }).unwrap();
      } else {
        await createStudent(body).unwrap();
      }

      if (stayOnPage && !studentId) {
        appliedParentId.current = null;
        setForm(emptyForm());
        setCreatedAt(todayInputDate());
        return;
      }

      router.push("/students");
    } catch (error) {
      setFormError(getApiErrorMessage(error, "Select a parent"));
    }
  }

  if (isEdit && studentLoading) {
    return (
      <p className="rounded-3xl border border-border bg-white p-8 text-sm text-muted">
        Loading student…
      </p>
    );
  }

  return (
    <form
      className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(false);
      }}
    >
      <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-foreground">
        {isEdit ? "Edit Student" : "Add New Student"}
      </h1>

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
        <Field id="parentId" label="Parent" required>
          <select
            id="parentId"
            required
            value={form.parentId}
            onChange={(event) => update("parentId", event.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">Choose parent*</option>
            {parentOptions.map((parent) => (
              <option key={parent.id} value={String(parent.id)}>
                {parent.fullName}
              </option>
            ))}
          </select>
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
          id="bloodTypeId"
          label="Blood type"
          placeholder="Blood type"
          value={form.bloodTypeId}
          options={bloodTypes}
          onChange={(value) => update("bloodTypeId", value)}
        />
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

        <Field id="phoneNumber" label="Phone number">
          <input
            id="phoneNumber"
            value={form.phoneNumber}
            onChange={(event) => update("phoneNumber", event.target.value)}
            placeholder="Phone Number"
            className={inputClass}
          />
        </Field>
        <Field id="urgentNumber" label="Urgent phone number">
          <input
            id="urgentNumber"
            readOnly
            aria-readonly="true"
            value={form.urgentNumber}
            placeholder="Urgent phone from parent"
            className={`${inputClass} bg-stone-50 text-muted`}
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
        <Field id="motherName" label="Mother name">
          <input
            id="motherName"
            value={form.motherName}
            onChange={(event) => update("motherName", event.target.value)}
            placeholder="Mother name"
            className={inputClass}
          />
        </Field>
        <Field id="motherFamily" label="Mother family">
          <input
            id="motherFamily"
            value={form.motherFamily}
            onChange={(event) => update("motherFamily", event.target.value)}
            placeholder="Mother family"
            className={inputClass}
          />
        </Field>
        <Field id="motherPhone" label="Mother phone">
          <input
            id="motherPhone"
            value={form.motherPhone}
            onChange={(event) => update("motherPhone", event.target.value)}
            placeholder="Mother phone"
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
      </div>
    </form>
  );
}
