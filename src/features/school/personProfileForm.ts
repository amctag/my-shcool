import type { SaveTeacherBody } from "@/features/school/types";

/**
 * Limits below mirror the real `persons` table columns. They are column
 * lengths, not business rules, so valid existing data is never rejected.
 */
export const PERSON_TEXT_LIMITS = {
  name: 100,
  contact: 50,
  email: 255,
  address: 2000,
  place: 255,
} as const;

/** `persons.register_id` is a PostgreSQL INT4 column. */
export const REGISTER_ID_MIN = 1;
export const REGISTER_ID_MAX = 2_147_483_647;
export const REGISTER_ID_RANGE_MESSAGE =
  "Register ID must be a whole number between 1 and 2,147,483,647.";

export type PersonProfileFormState = {
  firstName: string;
  middleName: string;
  lastName: string;
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

export type PersonProfileFormErrors = Partial<
  Record<keyof PersonProfileFormState, string>
>;

export function emptyPersonProfileForm(): PersonProfileFormState {
  return {
    firstName: "",
    middleName: "",
    lastName: "",
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

function requiredText(
  value: string,
  label: string,
  maxLength: number,
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${label} is required.`;
  }
  if (trimmed.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }
  return undefined;
}

function optionalText(
  value: string,
  label: string,
  maxLength: number,
): string | undefined {
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }
  return undefined;
}

function lookupId(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > REGISTER_ID_MAX) {
    return "Select a valid option.";
  }
  return undefined;
}

function validateRegisterId(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (!/^\d+$/.test(trimmed)) {
    return REGISTER_ID_RANGE_MESSAGE;
  }

  const parsed = Number(trimmed);
  if (
    !Number.isSafeInteger(parsed) ||
    parsed < REGISTER_ID_MIN ||
    parsed > REGISTER_ID_MAX
  ) {
    return REGISTER_ID_RANGE_MESSAGE;
  }

  return undefined;
}

function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.length > PERSON_TEXT_LIMITS.email) {
    return `Email must be ${PERSON_TEXT_LIMITS.email} characters or fewer.`;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return undefined;
}

function validatePhone(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Phone number is required.";
  }
  if (trimmed.length > PERSON_TEXT_LIMITS.contact) {
    return `Phone number must be ${PERSON_TEXT_LIMITS.contact} characters or fewer.`;
  }
  if (!/\d/.test(trimmed)) {
    return "Enter a valid phone number.";
  }
  return undefined;
}

function validateBirthday(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "Enter a valid date.";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "Enter a valid date.";
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date.getTime() > today.getTime()) {
    return "Date of birth cannot be in the future.";
  }

  return undefined;
}

export function validatePersonProfileForm(
  form: PersonProfileFormState,
): PersonProfileFormErrors {
  const errors: PersonProfileFormErrors = {};

  const firstName = requiredText(
    form.firstName,
    "First name",
    PERSON_TEXT_LIMITS.name,
  );
  if (firstName) {
    errors.firstName = firstName;
  }

  const middleName = optionalText(
    form.middleName,
    "Middle name",
    PERSON_TEXT_LIMITS.name,
  );
  if (middleName) {
    errors.middleName = middleName;
  }

  const lastName = requiredText(
    form.lastName,
    "Family name",
    PERSON_TEXT_LIMITS.name,
  );
  if (lastName) {
    errors.lastName = lastName;
  }

  if (form.gender && form.gender !== "0" && form.gender !== "1") {
    errors.gender = "Select a valid gender.";
  }

  const nationalityId = lookupId(form.nationalityId);
  if (nationalityId) {
    errors.nationalityId = nationalityId;
  }

  const governorateId = lookupId(form.governorateId);
  if (governorateId) {
    errors.governorateId = governorateId;
  }

  const regionId = lookupId(form.regionId);
  if (regionId) {
    errors.regionId = regionId;
  }

  const registerId = validateRegisterId(form.registerId);
  if (registerId) {
    errors.registerId = registerId;
  }

  const identityNumber = optionalText(
    form.identityNumber,
    "Identity number",
    PERSON_TEXT_LIMITS.contact,
  );
  if (identityNumber) {
    errors.identityNumber = identityNumber;
  }

  const birthday = validateBirthday(form.birthday);
  if (birthday) {
    errors.birthday = birthday;
  }

  const placeOfBirth = optionalText(
    form.placeOfBirth,
    "Place of birth",
    PERSON_TEXT_LIMITS.place,
  );
  if (placeOfBirth) {
    errors.placeOfBirth = placeOfBirth;
  }

  const email = validateEmail(form.email);
  if (email) {
    errors.email = email;
  }

  const phoneNumber = validatePhone(form.phoneNumber);
  if (phoneNumber) {
    errors.phoneNumber = phoneNumber;
  }

  const urgentNumber = optionalText(
    form.urgentNumber,
    "Urgent phone number",
    PERSON_TEXT_LIMITS.contact,
  );
  if (urgentNumber) {
    errors.urgentNumber = urgentNumber;
  }

  const landline = optionalText(
    form.landline,
    "Telephone",
    PERSON_TEXT_LIMITS.contact,
  );
  if (landline) {
    errors.landline = landline;
  }

  const village = optionalText(
    form.village,
    "Village",
    PERSON_TEXT_LIMITS.place,
  );
  if (village) {
    errors.village = village;
  }

  const address = optionalText(
    form.address,
    "Address",
    PERSON_TEXT_LIMITS.address,
  );
  if (address) {
    errors.address = address;
  }

  return errors;
}

export function hasFormErrors(errors: PersonProfileFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

function optionalLookupId(value: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function personProfileToBody(
  form: PersonProfileFormState,
): SaveTeacherBody {
  const gender =
    form.gender === "0" || form.gender === "1"
      ? Number(form.gender)
      : undefined;
  const registerId = form.registerId.trim();

  return {
    firstName: form.firstName.trim(),
    middleName: form.middleName.trim() || undefined,
    lastName: form.lastName.trim(),
    gender,
    nationalityId: optionalLookupId(form.nationalityId),
    registerId: registerId === "" ? null : Number(registerId),
    governorateId: optionalLookupId(form.governorateId),
    regionId: optionalLookupId(form.regionId),
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

/**
 * Keeps only the API field errors that belong to this form, so an unexpected
 * server field cannot inject an unknown key into the error state.
 */
export function serverFieldErrorsToFormErrors(
  fieldErrors: Record<string, string>,
): PersonProfileFormErrors {
  const errors: PersonProfileFormErrors = {};
  for (const key of Object.keys(
    emptyPersonProfileForm(),
  ) as Array<keyof PersonProfileFormState>) {
    const message = fieldErrors[key];
    if (message) {
      errors[key] = message;
    }
  }
  return errors;
}
