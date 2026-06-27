export function normalizeTimeString(time: string | null | undefined) {
  if (!time) {
    return "";
  }

  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return "";
  }

  const hours = String(Number.parseInt(match[1], 10)).padStart(2, "0");
  return `${hours}:${match[2]}`;
}
