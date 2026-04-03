/**
 * Unified operation status logic for reservations.
 * Must be the single source of truth across Dashboard, Checkin, and Checkout.
 */

export type OperationStatus =
  | "arriving_today"
  | "departing_today"
  | "in_house"
  | "checked_out"
  | "upcoming";

interface ReservationForStatus {
  check_in: string;
  check_out: string;
  status: string;
  checked_in_at?: string | null;
  checked_out_at?: string | null;
}

export function computeOperationStatus(r: ReservationForStatus): OperationStatus {
  const today = new Date().toISOString().split("T")[0];

  // 1. Already checked out
  if (r.checked_out_at || r.status === "completed") {
    return "checked_out";
  }

  // 2. Departing today
  if (
    r.check_out === today &&
    r.checked_in_at &&
    !r.checked_out_at
  ) {
    return "departing_today";
  }

  // 3. Arriving today
  if (
    r.check_in === today &&
    !r.checked_in_at &&
    !r.checked_out_at &&
    ["pending", "confirmed"].includes(r.status)
  ) {
    return "arriving_today";
  }

  // 4. In house
  if (
    r.checked_in_at &&
    !r.checked_out_at &&
    today >= r.check_in &&
    today < r.check_out
  ) {
    return "in_house";
  }

  // 5. Upcoming
  if (
    r.check_in > today &&
    ["pending", "confirmed"].includes(r.status)
  ) {
    return "upcoming";
  }

  return "checked_out";
}
