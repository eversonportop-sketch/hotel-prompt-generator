
CREATE OR REPLACE FUNCTION public.validate_reservation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.check_out <= NEW.check_in THEN
    RAISE EXCEPTION 'check_out must be after check_in';
  END IF;
  IF NEW.guests_count < 1 THEN
    RAISE EXCEPTION 'guests_count must be at least 1';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.reservations
    WHERE room_id = NEW.room_id
      AND id IS DISTINCT FROM NEW.id
      AND status IN ('pending', 'confirmed')
      AND check_in < NEW.check_out
      AND check_out > NEW.check_in
  ) THEN
    RAISE EXCEPTION 'Room is not available for the selected dates';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
