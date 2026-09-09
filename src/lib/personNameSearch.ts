export function personNameMatches(
  query: string,
  parts: Array<string | null | undefined>,
): boolean {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return false;
  }

  const haystacks = parts
    .map((part) => part?.trim().toLowerCase())
    .filter((part): part is string => Boolean(part));

  return tokens.every((token) =>
    haystacks.some((part) => part.includes(token)),
  );
}
