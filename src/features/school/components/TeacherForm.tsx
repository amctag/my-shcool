"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getApiErrorMessage,
  getApiFieldErrors,
} from "@/lib/getApiErrorMessage";
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
  const [form, setForm] = useState<PersonProfileFormState>(
    emptyPersonProfileForm,
  );
  const [errors, setErrors] = useState<PersonProfileFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      ...emptyPersonProfileForm(),
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
    setErrors({});
    setFormError(null);
  }, [teacher]);

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
      if (teacherId) {
        await updateTeacher({ id: teacherId, body }).unwrap();
      } else {
        await createTeacher(body).unwrap();
      }

      if (stayOnPage && !teacherId) {
        setForm(emptyPersonProfileForm());
        setSuccessMessage("Teacher saved. You can add another one.");
        return;
      }

      router.push("/teachers");
    } catch (error) {
      const fieldErrors = serverFieldErrorsToFormErrors(
        getApiFieldErrors(error),
      );
      if (hasFormErrors(fieldErrors)) {
        setErrors(fieldErrors);
      }
      setFormError(getApiErrorMessage(error, "Could not save teacher"));
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
    <PersonRecordForm
      title={readOnly ? "View Teacher" : isEdit ? "Edit Teacher" : "Add New Teacher"}
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
      createdAt={teacher?.createdAt}
      showSaveAndNew={!isEdit && !readOnly}
      onReset={resetForm}
      onSubmit={() => void onSave(false)}
      onSubmitAndNew={() => void onSave(true)}
    />
  );
}
