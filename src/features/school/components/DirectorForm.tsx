"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { School } from "lucide-react";
import {
  getApiErrorMessage,
  getApiFieldErrors,
} from "@/lib/getApiErrorMessage";
import { selectAuthReady, selectSchoolName } from "@/features/auth/authSlice";
import {
  useCreateDirectorMutation,
  useGetDirectorQuery,
  useUpdateDirectorMutation,
} from "@/features/school/api/directorsApi";
import {
  useGetGovernoratesQuery,
  useGetNationalitiesQuery,
  useGetRegionsQuery,
} from "@/features/school/api/lookupsApi";
import { PersonRecordForm } from "@/features/school/components/PersonRecordForm";
import {
  emptyPersonProfileForm,
  hasFormErrors,
  personProfileToBody,
  serverFieldErrorsToFormErrors,
  validatePersonProfileForm,
  type PersonProfileFormErrors,
  type PersonProfileFormState,
} from "@/features/school/personProfileForm";
import { useAppSelector } from "@/store/hooks";

function optionalNumber(value: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function DirectorForm({
  directorId,
  readOnly = false,
}: {
  directorId?: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const authReady = useAppSelector(selectAuthReady);
  const schoolName = useAppSelector(selectSchoolName);
  const isEdit = Boolean(directorId) && !readOnly;
  const [form, setForm] = useState<PersonProfileFormState>(
    emptyPersonProfileForm,
  );
  const [errors, setErrors] = useState<PersonProfileFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: director, isLoading: directorLoading } = useGetDirectorQuery(
    directorId ?? 0,
    { skip: !authReady || !directorId },
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

  const [createDirector, createState] = useCreateDirectorMutation();
  const [updateDirector, updateState] = useUpdateDirectorMutation();
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
    if (!director) {
      return;
    }

    setForm({
      ...emptyPersonProfileForm(),
      firstName: director.firstName,
      middleName: director.middleName,
      lastName: director.lastName,
      gender: director.gender === null ? "" : String(director.gender),
      nationalityId: director.nationalityId
        ? String(director.nationalityId)
        : "",
      registerId:
        director.registerId === null ? "" : String(director.registerId),
      governorateId: director.governorateId
        ? String(director.governorateId)
        : "",
      identityNumber: director.identityNumber ?? "",
      village: director.village ?? "",
      birthday: director.birthday ?? "",
      placeOfBirth: director.placeOfBirth ?? "",
      email: director.email ?? "",
      phoneNumber: director.phoneNumber ?? "",
      urgentNumber: director.urgentNumber ?? "",
      landline: director.landline ?? "",
      regionId: director.regionId ? String(director.regionId) : "",
      address: director.address ?? "",
    });
    setErrors({});
    setFormError(null);
  }, [director]);

  function update<K extends keyof PersonProfileFormState>(
    key: K,
    value: PersonProfileFormState[K],
  ) {
    setForm((current) => {
      if (key === "governorateId") {
        return { ...current, governorateId: value as string, regionId: "" };
      }
      return { ...current, [key]: value };
    });
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      return next;
    });
    setSuccessMessage(null);
  }

  function resetForm() {
    setForm(emptyPersonProfileForm());
    setErrors({});
    setFormError(null);
    setSuccessMessage(null);
  }

  async function onSave(stayOnPage: boolean) {
    if (saving) {
      return;
    }

    setFormError(null);
    setSuccessMessage(null);

    const nextErrors = validatePersonProfileForm(form);
    if (hasFormErrors(nextErrors)) {
      setErrors(nextErrors);
      setFormError("Please fix the highlighted fields before saving.");
      return;
    }

    setErrors({});
    const body = personProfileToBody(form);

    try {
      if (directorId) {
        await updateDirector({ id: directorId, body }).unwrap();
      } else {
        await createDirector(body).unwrap();
      }

      if (stayOnPage && !directorId) {
        setForm(emptyPersonProfileForm());
        setSuccessMessage("Director saved. You can add another one.");
        return;
      }

      router.push("/directors");
    } catch (error) {
      const fieldErrors = serverFieldErrorsToFormErrors(
        getApiFieldErrors(error),
      );
      if (hasFormErrors(fieldErrors)) {
        setErrors(fieldErrors);
      }
      setFormError(getApiErrorMessage(error, "Could not save director"));
    }
  }

  if (directorId && directorLoading) {
    return (
      <p className="rounded-3xl border border-border bg-white p-8 text-sm text-muted">
        Loading director…
      </p>
    );
  }

  return (
    <PersonRecordForm
      title={
        readOnly ? "View Director" : isEdit ? "Edit Director" : "Add New Director"
      }
      form={form}
      errors={errors}
      onChange={update}
      nationalities={nationalities}
      governorates={governorates}
      regions={regions}
      governorateId={governorateId}
      readOnly={readOnly}
      saving={saving}
      formError={formError}
      successMessage={successMessage}
      createdAt={director?.createdAt}
      showSaveAndNew={!isEdit && !readOnly}
      onReset={resetForm}
      onSubmit={() => void onSave(false)}
      onSubmitAndNew={() => void onSave(true)}
      aside={
        <div className="mt-6 rounded-2xl border border-border bg-primary-soft/50 px-4 py-3.5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <School aria-hidden className="h-3.5 w-3.5 text-primary" />
            School assignment
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {director?.schoolName ?? schoolName ?? "Current school"}
          </p>
          <p className="mt-1 text-xs text-muted">
            Directors are created for the school you are signed in to. Tenant
            access is applied automatically.
          </p>
          {director ? (
            <p className="mt-2 text-xs font-medium text-muted">
              Director ID #{director.directorId} · Person ID #{director.personId}
            </p>
          ) : null}
        </div>
      }
    />
  );
}
