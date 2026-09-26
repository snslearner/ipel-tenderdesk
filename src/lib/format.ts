type Num = number | null | undefined;

const DASH = "—";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const inrWhole = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const twoDp = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatINR(value: Num): string {
  return value == null ? DASH : inr.format(value);
}

// Card-friendly: ₹19.69 Cr, ₹20.73 L, or whole rupees below one lakh.
export function formatINRCompact(value: Num): string {
  if (value == null) return DASH;
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${sign}₹${twoDp.format(abs / 1e7)} Cr`;
  if (abs >= 1e5) return `${sign}₹${twoDp.format(abs / 1e5)} L`;
  return `${sign}${inrWhole.format(abs)}`;
}

export function formatPct(value: Num): string {
  return value == null ? DASH : `${value.toFixed(1)}%`;
}

export function formatQty(value: Num): string {
  return value == null ? DASH : value.toLocaleString("en-IN", { maximumFractionDigits: 3 });
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

// Postgres `date` values arrive as YYYY-MM-DD; format in UTC so the day never shifts.
export function formatDate(value: string | null | undefined): string {
  if (!value) return DASH;
  return dateFmt.format(new Date(value.length === 10 ? `${value}T00:00:00Z` : value));
}

// Calendar date in India (YYYY-MM-DD), independent of the server's timezone.
export function todayIST(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now);
}
