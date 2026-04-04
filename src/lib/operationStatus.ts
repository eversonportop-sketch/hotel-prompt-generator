/**
 * Unified operation status logic for reservations.
 * Single source of truth across Dashboard, Checkin, and Checkout.
 *
 * DB statuses: confirmed | checked_in | checked_out | canceled
 */

export type OperationStatus = "arriving_today" | "departing_today" | "in_house" | "checked_out" | "upcoming";

interface ReservationForStatus {
  check_in: string;
  check_out: string;
  status: string;
  checked_in_at?: string | null;
  checked_out_at?: string | null;
}

/** Normalise any date/timestamp string to YYYY-MM-DD */
function toDateOnly(v: string): string {
  return v.slice(0, 10);
}

/** Local today as YYYY-MM-DD */
function localToday(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function computeOperationStatus(r: ReservationForStatus): OperationStatus {
  const today = localToday();
  const checkIn = toDateOnly(r.check_in);
  const checkOut = toDateOnly(r.check_out);

  // 1. Already checked out
  if (r.status === "checked_out" || r.checked_out_at) {
    return "checked_out";
  }

  // 2. Canceled = treat as finished
  if (r.status === "canceled") {
    return "checked_out";
  }

  // 3. Checked in (status = checked_in OR has checked_in_at)
  if (r.status === "checked_in" || r.checked_in_at) {
    if (checkOut === today) return "departing_today";
    // Still in house (even if past checkout date — needs manual checkout)
    return "in_house";
  }

  // 4. Confirmed — not yet checked in
  if (r.status === "confirmed") {
    if (checkIn === today) return "arriving_today";
    if (checkIn > today) return "upcoming";
    // Past check-in date without check-in = no-show
    return "checked_out";
  }

  // Fallback for any unknown status
  if (checkIn > today) return "upcoming";
  return "checked_out";
}
