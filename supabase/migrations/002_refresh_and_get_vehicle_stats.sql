-- refresh_vehicle_status を呼び出してから vehicles を SELECT する2往復を1往復に削減する
CREATE OR REPLACE FUNCTION get_vehicle_stats()
RETURNS TABLE(status text, cnt bigint) AS $$
BEGIN
  UPDATE vehicles SET status =
    CASE
      WHEN LEAST(inspection_expiry, compulsory_insurance_expiry) < CURRENT_DATE THEN 'expired'
      WHEN LEAST(inspection_expiry, compulsory_insurance_expiry) <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
      ELSE 'active'
    END;

  RETURN QUERY
    SELECT v.status, COUNT(*)::bigint FROM vehicles v GROUP BY v.status;
END;
$$ LANGUAGE plpgsql;
