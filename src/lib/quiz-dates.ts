/** Calendar-local day, avoiding UTC rollover near midnight. */
export function localToday(now = new Date()): string {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
export function validDueDate(value: string, today = localToday()): boolean {
  if (!value) return true; // This question remains optional.
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value && value >= today;
}
