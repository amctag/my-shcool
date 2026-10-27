"use client";

import type { ReactNode } from "react";
import type { LookupItem, RegionItem } from "@/features/school/types";
import type {
  PersonProfileFormErrors,
  PersonProfileFormState,
} from "@/features/school/personProfileForm";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted/80 focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function inputClassFor(error?: string): string {
  return error ? `${inputClass} border-red-500` : inputClass;
}

function a11yProps(id: string, error?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const;
}

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const GENDERS = [
  { value: "", label: "Gender" },
  { value: "0", label: "Male" },
  { value: "1", label: "Female" },
];

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="block min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
        {required ? " (required)" : ""}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1 text-xs font-medium text-red-600"
        >
          {error}
        </p>
      ) : null}
    </div>
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
  error,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  options: LookupItem[];
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <Field id={id} label={label} error={error}>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        {...a11yProps(id, error)}
        className={`${inputClassFor(error)} cursor-pointer disabled:bg-stone-50 disabled:text-muted`}
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

export function PersonRecordForm({
  title,
  form,
  errors,
  onChange,
  nationalities,
  governorates,
  regions,
  governorateId,
  readOnly = false,
  saving = false,
  formError,
  successMessage,
  createdAt,
  aside,
  showSaveAndNew = false,
  onReset,
  onSubmit,
  onSubmitAndNew,
}: {
  title: string;
  form: PersonProfileFormState;
  errors: PersonProfileFormErrors;
  onChange: <K extends keyof PersonProfileFormState>(
    key: K,
    value: PersonProfileFormState[K],
  ) => void;
  nationalities: LookupItem[];
  governorates: LookupItem[];
  regions: RegionItem[];
  governorateId?: number;
  readOnly?: boolean;
  saving?: boolean;
  formError?: string | null;
  successMessage?: string | null;
  createdAt?: string | null;
  aside?: ReactNode;
  showSaveAndNew?: boolean;
  onReset: () => void;
  onSubmit: () => void;
  onSubmitAndNew?: () => void;
}) {
  return (
    <form
      noValidate
      className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (!readOnly && !saving) {
          onSubmit();
        }
      }}
    >
      <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>

      <fieldset
        disabled={readOnly}
        className="min-w-0 border-0 p-0 disabled:[&_input]:bg-stone-50 disabled:[&_select]:bg-stone-50 disabled:[&_input]:text-muted disabled:[&_select]:text-muted disabled:[&_label]:cursor-not-allowed"
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field id="firstName" label="First Name" required error={errors.firstName}>
            <input
              id="firstName"
              required
              value={form.firstName}
              onChange={(event) => onChange("firstName", event.target.value)}
              placeholder="First Name*"
              {...a11yProps("firstName", errors.firstName)}
              className={inputClassFor(errors.firstName)}
            />
          </Field>
          <Field id="middleName" label="Middle Name" error={errors.middleName}>
            <input
              id="middleName"
              value={form.middleName}
              onChange={(event) => onChange("middleName", event.target.value)}
              placeholder="Middle Name"
              {...a11yProps("middleName", errors.middleName)}
              className={inputClassFor(errors.middleName)}
            />
          </Field>
          <Field id="lastName" label="Family" required error={errors.lastName}>
            <input
              id="lastName"
              required
              value={form.lastName}
              onChange={(event) => onChange("lastName", event.target.value)}
              placeholder="Family*"
              {...a11yProps("lastName", errors.lastName)}
              className={inputClassFor(errors.lastName)}
            />
          </Field>
          <Field id="gender" label="Gender" error={errors.gender}>
            <select
              id="gender"
              value={form.gender}
              onChange={(event) => onChange("gender", event.target.value)}
              {...a11yProps("gender", errors.gender)}
              className={`${inputClassFor(errors.gender)} cursor-pointer`}
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
            onChange={(value) => onChange("nationalityId", value)}
            error={errors.nationalityId}
          />
          <Field id="registerId" label="Register ID" error={errors.registerId}>
            <input
              id="registerId"
              type="number"
              step={1}
              min={1}
              max={2_147_483_647}
              inputMode="numeric"
              value={form.registerId}
              onChange={(event) => onChange("registerId", event.target.value)}
              placeholder="Register ID"
              {...a11yProps("registerId", errors.registerId)}
              className={inputClassFor(errors.registerId)}
            />
          </Field>
          <Field
            id="identityNumber"
            label="Identity Number"
            error={errors.identityNumber}
          >
            <input
              id="identityNumber"
              value={form.identityNumber}
              onChange={(event) => onChange("identityNumber", event.target.value)}
              placeholder="Identity Number"
              {...a11yProps("identityNumber", errors.identityNumber)}
              className={inputClassFor(errors.identityNumber)}
            />
          </Field>
          <Field id="birthday" label="Date of Birth" error={errors.birthday}>
            <input
              id="birthday"
              type="date"
              max={todayIsoDate()}
              value={form.birthday}
              onChange={(event) => onChange("birthday", event.target.value)}
              {...a11yProps("birthday", errors.birthday)}
              className={inputClassFor(errors.birthday)}
            />
          </Field>
          <Field
            id="placeOfBirth"
            label="Place of birth"
            error={errors.placeOfBirth}
          >
            <input
              id="placeOfBirth"
              value={form.placeOfBirth}
              onChange={(event) => onChange("placeOfBirth", event.target.value)}
              placeholder="Place Of birth"
              {...a11yProps("placeOfBirth", errors.placeOfBirth)}
              className={inputClassFor(errors.placeOfBirth)}
            />
          </Field>
          <Field id="email" label="Email" error={errors.email}>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => onChange("email", event.target.value)}
              placeholder="Email"
              {...a11yProps("email", errors.email)}
              className={inputClassFor(errors.email)}
            />
          </Field>

          <div className="col-span-full grid gap-4 sm:grid-cols-3">
            <LookupSelect
              id="governorateId"
              label="Governorate"
              placeholder="Governorate / المحافظة"
              value={form.governorateId}
              options={governorates}
              onChange={(value) => onChange("governorateId", value)}
              error={errors.governorateId}
            />
            <LookupSelect
              id="regionId"
              label="Region"
              placeholder={
                governorateId ? "Region / القضاء" : "Select a governorate first"
              }
              value={form.regionId}
              options={regions}
              onChange={(value) => onChange("regionId", value)}
              disabled={!governorateId}
              error={errors.regionId}
            />
            <Field id="village" label="Village" error={errors.village}>
              <input
                id="village"
                value={form.village}
                onChange={(event) => onChange("village", event.target.value)}
                placeholder="Village"
                {...a11yProps("village", errors.village)}
                className={inputClassFor(errors.village)}
              />
            </Field>
          </div>

          <Field
            id="phoneNumber"
            label="Phone number"
            required
            error={errors.phoneNumber}
          >
            <input
              id="phoneNumber"
              required
              value={form.phoneNumber}
              onChange={(event) => onChange("phoneNumber", event.target.value)}
              placeholder="Phone Number*"
              {...a11yProps("phoneNumber", errors.phoneNumber)}
              className={inputClassFor(errors.phoneNumber)}
            />
          </Field>
          <Field
            id="urgentNumber"
            label="Urgent phone number"
            error={errors.urgentNumber}
          >
            <input
              id="urgentNumber"
              value={form.urgentNumber}
              onChange={(event) => onChange("urgentNumber", event.target.value)}
              placeholder="Urgent phone Number"
              {...a11yProps("urgentNumber", errors.urgentNumber)}
              className={inputClassFor(errors.urgentNumber)}
            />
          </Field>
          <Field id="landline" label="Telephone" error={errors.landline}>
            <input
              id="landline"
              value={form.landline}
              onChange={(event) => onChange("landline", event.target.value)}
              placeholder="Telephone"
              {...a11yProps("landline", errors.landline)}
              className={inputClassFor(errors.landline)}
            />
          </Field>
        </div>

        {aside}

        <div className="mt-6 grid items-center gap-3 lg:grid-cols-[7.5rem_1fr]">
          <label
            htmlFor="address"
            className="text-sm font-semibold text-primary"
          >
            Address
          </label>
          <div className="min-w-0">
            <input
              id="address"
              value={form.address}
              onChange={(event) => onChange("address", event.target.value)}
              placeholder="Address"
              {...a11yProps("address", errors.address)}
              className={inputClassFor(errors.address)}
            />
            {errors.address ? (
              <p
                id="address-error"
                role="alert"
                className="mt-1 text-xs font-medium text-red-600"
              >
                {errors.address}
              </p>
            ) : null}
          </div>
        </div>

        {formError ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}
        {successMessage ? (
          <p className="mt-4 text-sm font-medium text-emerald-700" role="status">
            {successMessage}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {createdAt ? (
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">
                Date created:
              </span>{" "}
              {createdAt}
            </p>
          ) : (
            <span />
          )}
          {readOnly ? null : (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onReset}
                disabled={saving}
                className="h-11 cursor-pointer rounded-xl bg-primary px-5 text-sm font-medium text-on-primary transition-colors duration-200 hover:bg-primary-hover disabled:opacity-60"
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
              {showSaveAndNew ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={onSubmitAndNew}
                  className="h-11 cursor-pointer rounded-xl bg-primary-hover px-5 text-sm font-medium text-on-primary transition-colors duration-200 hover:opacity-90 disabled:opacity-60"
                >
                  Save & new
                </button>
              ) : null}
            </div>
          )}
        </div>
      </fieldset>
    </form>
  );
}
