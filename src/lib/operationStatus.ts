/**
 * Unified operation status logic for reservations.
 * Must be the single source of truth across Dashboard, Checkin, and Checkout.
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

/** Local today as YYYY-MM-DD (avoids UTC shift issues) */
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

  // 1. Already checked out (highest priority)
  if (r.checked_out_at || r.status === "completed" || r.status === "checked_out") {
    return "checked_out";
  }

  // 2. Departing today
  if (checkOut === today && r.checked_in_at && !r.checked_out_at) {
    return "departing_today";
  }

  // 3. In house (before arriving_today so same-day stays with check-in done are in_house)
  if (r.checked_in_at && !r.checked_out_at && today >= checkIn && today < checkOut) {
    return "in_house";
  }

  // 4. Arriving today
  if (checkIn === today && !r.checked_in_at && !r.checked_out_at && ["pending", "confirmed"].includes(r.status)) {
    return "arriving_today";
  }

  // 5. Upcoming
  if (checkIn > today && !r.checked_in_at && !r.checked_out_at && ["pending", "confirmed"].includes(r.status)) {
    return "upcoming";
  }

  // 6. Fallback for checked-in guests past their checkout date
  if (r.checked_in_at && !r.checked_out_at) {
    return "in_house";
  }

  // 7. Past reservations without check-in = no-show, treat as checked_out
  if (checkIn <= today) {
    return "checked_out";
  }

  return "upcoming";
}
