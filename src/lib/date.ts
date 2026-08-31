/** Convert any YYYY-MM-DD value to a local midnight Date. */
export function dateOnly(value?: string | Date | null): Date | null {
  if (!value) return null;
  const source = value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
  const result = new Date(`${source}T00:00:00`);
  return Number.isNaN(result.getTime()) ? null : result;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(offset: number, base = new Date()): string {
  const date = new Date(base);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function formatDate(value?: string | null): string {
  const date = dateOnly(value);
  return date ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

export function getExpiryStatus(expiryDate?: string | null, alertBeforeDays = 7): 'safe' | 'near' | 'expired' | 'unknown' {
  const expiry = dateOnly(expiryDate);
  if (!expiry) return 'unknown';
  const today = dateOnly(todayISO())!;
  const days = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return 'expired';
  if (days <= Number(alertBeforeDays || 7)) return 'near';
  return 'safe';
}
