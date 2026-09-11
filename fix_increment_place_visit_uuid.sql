-- Fix: increment_place_visit has never worked.
--
-- update_places_schema.sql declares:
--     CREATE FUNCTION increment_place_visit(place_id INT)
--     ... WHERE id = place_id;
--
-- but user_places.id is a UUID. Two things went wrong as a result:
--
--   1. The client called parseInt(place.id) to satisfy the INT signature.
--      parseInt("2d3e2591-610c-4bb0-...") stops at the first non-digit and
--      returns 2 — so every place resolved to the same bogus id.
--   2. Even with that value, `WHERE id = place_id` compares uuid to integer,
--      which Postgres rejects ("operator does not exist: uuid = integer").
--
-- The RPC therefore always errored, the client swallowed it in a catch, and
-- visited_count stayed at 0 for every row.
--
-- This migration retypes the argument to UUID. The client now passes
-- place.id unchanged (see src/app/places/page.tsx).

-- Remove the old INT overload so the name is unambiguous.
DROP FUNCTION IF EXISTS increment_place_visit(INT);

CREATE OR REPLACE FUNCTION increment_place_visit(place_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_places
  SET visited_count = COALESCE(visited_count, 0) + 1
  WHERE id = place_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Callable by anonymous visitors, which is who views a place page.
GRANT EXECUTE ON FUNCTION increment_place_visit(UUID) TO anon, authenticated;
