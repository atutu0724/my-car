-- companies テーブルに会社コード列を追加
ALTER TABLE companies ADD COLUMN IF NOT EXISTS code TEXT UNIQUE NOT NULL DEFAULT '';

-- デフォルト値を除去（新規登録時は必須入力）
ALTER TABLE companies ALTER COLUMN code DROP DEFAULT;

-- 既存データがある場合は id の先頭8文字をコードとして設定
UPDATE companies SET code = LEFT(id::text, 8) WHERE code = '';
