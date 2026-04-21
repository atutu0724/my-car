-- ============================================================
-- マルチテナント対応: RLS ポリシーを company_id ベースに変更
-- ユーザーの JWT user_metadata.company_id で自社データのみアクセス可
-- ============================================================

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "authenticated_all" ON companies;
DROP POLICY IF EXISTS "authenticated_all" ON employees;
DROP POLICY IF EXISTS "authenticated_all" ON vehicles;
DROP POLICY IF EXISTS "authenticated_all" ON documents;

-- ヘルパー関数: JWT から company_id を取得
CREATE OR REPLACE FUNCTION auth_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid
$$;

-- companies: 自社のみ参照可
CREATE POLICY "company_isolation" ON companies
  FOR ALL TO authenticated
  USING (id = auth_company_id())
  WITH CHECK (id = auth_company_id());

-- employees: 自社の従業員のみ
CREATE POLICY "company_isolation" ON employees
  FOR ALL TO authenticated
  USING (company_id = auth_company_id())
  WITH CHECK (company_id = auth_company_id());

-- vehicles: 自社の車両のみ
CREATE POLICY "company_isolation" ON vehicles
  FOR ALL TO authenticated
  USING (company_id = auth_company_id())
  WITH CHECK (company_id = auth_company_id());

-- documents: 自社のドキュメントのみ (テーブルが存在する場合)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents') THEN
    EXECUTE $policy$
      CREATE POLICY "company_isolation" ON documents
        FOR ALL TO authenticated
        USING (company_id = auth_company_id())
        WITH CHECK (company_id = auth_company_id())
    $policy$;
  END IF;
END;
$$;

-- RPC 関数を company_id フィルタ対応に更新
-- SECURITY DEFINER のまま維持するが、呼び出し元の company_id でフィルタ

CREATE OR REPLACE FUNCTION refresh_vehicle_status()
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid := (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid;
BEGIN
  UPDATE vehicles SET status =
    CASE
      WHEN LEAST(inspection_expiry, compulsory_insurance_expiry) < CURRENT_DATE THEN 'expired'
      WHEN LEAST(inspection_expiry, compulsory_insurance_expiry) <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
      ELSE 'active'
    END
  WHERE company_id = v_company_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_vehicle_stats()
RETURNS TABLE(status text, cnt bigint)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid := (auth.jwt() -> 'user_metadata' ->> 'company_id')::uuid;
BEGIN
  UPDATE vehicles SET status =
    CASE
      WHEN LEAST(inspection_expiry, compulsory_insurance_expiry) < CURRENT_DATE THEN 'expired'
      WHEN LEAST(inspection_expiry, compulsory_insurance_expiry) <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
      ELSE 'active'
    END
  WHERE company_id = v_company_id;

  RETURN QUERY
    SELECT v.status, COUNT(*)::bigint
    FROM vehicles v
    WHERE v.company_id = v_company_id
    GROUP BY v.status;
END;
$$ LANGUAGE plpgsql;
