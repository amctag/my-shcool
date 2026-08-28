export function NameWithInitials({
  firstName,
  lastName,
  name,
}: {
  firstName?: string;
  lastName?: string;
  name: string;
}) {
  const first = (firstName?.trim().charAt(0) ?? "").toUpperCase();
  const last = (lastName?.trim().charAt(0) ?? "").toUpperCase();
  const initials = `${first}${last}` || "?";

  return (
    <span className="inline-flex items-center gap-3">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold tracking-wide text-on-primary">
        {initials}
      </span>
      {name}
    </span>
  );
}
