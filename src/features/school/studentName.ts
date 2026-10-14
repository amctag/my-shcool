/**
 * Canonical student display name: student first name + father's first name
 * + family name, sourced from the linked Parent record via the API.
 *
 * Prefer the API-computed `studentFullName`; fall back to composing from the
 * name parts (never from the student's own `middleName`/`lastName`); render
 * "—" only when nothing is known. Do not invent missing father/family names.
 */
export type StudentNameSource = {
  studentFirstName?: string | null;
  fatherFirstName?: string | null;
  familyName?: string | null;
  studentFullName?: string | null;
  /** Legacy API fields (role-record display names). */
  fullName?: string | null;
  studentName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

function clean(value?: string | null): string {
  return value?.trim() ?? "";
}

export function getStudentFullName(source: StudentNameSource): string {
  const canonical =
    clean(source.studentFullName) ||
    clean(source.fullName) ||
    clean(source.studentName);
  if (canonical) {
    return canonical;
  }
  const composed = [
    clean(source.studentFirstName) || clean(source.firstName),
    clean(source.fatherFirstName),
    clean(source.familyName),
  ]
    .filter(Boolean)
    .join(" ");
  return composed || "—";
}
