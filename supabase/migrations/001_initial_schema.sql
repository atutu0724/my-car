-- ============================================================
-- 企業向け車両管理システム - データベーススキーマ
-- Supabase SQL Editor で実行してください
-- ============================================================

CREATE TABLE companies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  plan_type  TEXT NOT NULL CHECK (plan_type IN ('small', 'standard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE employees (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  line_user_id TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE vehicles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id                 UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  vehicle_type                TEXT NOT NULL CHECK (vehicle_type IN ('company', 'personal')),
  license_plate               TEXT NOT NULL,
  inspection_expiry           DATE NOT NULL,
  compulsory_insurance_expiry DATE NOT NULL,
  voluntary_insurance_expiry  DATE,
  status                      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'warning', 'expired')),
  image_url                   TEXT,
  created_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at                  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('inspection','compulsory_insurance','voluntary_insurance','license')),
  expiry_date   DATE NOT NULL,
  image_url     TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ステータス自動更新関数
CREATE OR REPLACE FUNCTION refresh_vehicle_status()
RETURNS void AS $$
BEGIN
  UPDATE vehicles SET status =
    CASE
      WHEN LEAST(inspection_expiry, compulsory_insurance_expiry) < CURRENT_DATE THEN 'expired'
      WHEN LEAST(inspection_expiry, compulsory_insurance_expiry) <= CURRENT_DATE + INTERVAL '30 days' THEN 'warning'
      ELSE 'active'
    END;
END;
$$ LANGUAGE plpgsql;

-- RLS 有効化
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- テスト用サンプルデータ
INSERT INTO companies (id, name, plan_type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'テスト株式会社', 'standard');

INSERT INTO employees (id, company_id, name) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '山田 太郎'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '鈴木 花子'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '田中 次郎');

INSERT INTO vehicles (company_id, employee_id, vehicle_type, license_plate, inspection_expiry, compulsory_insurance_expiry, voluntary_insurance_expiry, status) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'personal', '品川 500 あ 1234', '2026-08-15', '2026-08-15', '2026-08-15', 'active'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'personal', '横浜 300 い 5678', '2026-05-01', '2026-05-01', '2026-05-01', 'warning'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'company',  '品川 100 う 9012', '2026-03-01', '2026-03-01', NULL,          'expired');
