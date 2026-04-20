-- ============================================================
-- RLS ポリシー設定 + line_sessions テーブル追加
-- ============================================================

-- line_sessions テーブル（LINE Botの会話セッション管理用）
CREATE TABLE IF NOT EXISTS line_sessions (
  line_user_id TEXT PRIMARY KEY,
  step         TEXT NOT NULL DEFAULT 'idle',
  vehicle_id   UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  temp_data    JSONB NOT NULL DEFAULT '{}',
  updated_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- line_sessions は service_role のみアクセス（RLS有効化するが一般ユーザーはアクセス不可）
ALTER TABLE line_sessions ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザー（管理者）向け RLS ポリシー
-- このシステムはシングルテナント管理画面のため、ログイン済みなら全操作を許可する

CREATE POLICY "authenticated_all" ON companies
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all" ON employees
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all" ON vehicles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_all" ON documents
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- RPC 関数のうち refresh_vehicle_status と get_vehicle_stats は
-- 内部で vehicles を UPDATE するため SECURITY DEFINER に変更して
-- RLS をバイパスさせる（呼び出し元が認証済みであることは DashboardLayout で保証済み）

CREATE OR REPLACE FUNCTION refresh_vehicle_status()
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vehicles SET status =
    CASE
      WHEN LEAST(inspection_expiry, compulsory_insurance_expiry) < CURRENT_DATE THEN 'expired'
      WHEN LEAST(inspection_expiry, compulsory_insurance_expiry) <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
      ELSE 'active'
    END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_vehicle_stats()
RETURNS TABLE(status text, cnt bigint)
SECURITY DEFINER
SET search_path = public
AS $$
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

-- ============================================================
-- テストデータ削除（本番環境向け）
-- 開発DB でのみ migration 001 のサンプルデータが入っている想定
-- 本番では以下を実行して初期化する
-- ============================================================
DELETE FROM vehicles  WHERE company_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM employees WHERE company_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM companies WHERE id         = '00000000-0000-0000-0000-000000000001';
