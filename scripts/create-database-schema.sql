-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- デバイステーブル
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  phone_number TEXT,
  emergency_contact TEXT,
  notes TEXT,
  pairing_code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_location_lat DOUBLE PRECISION,
  last_location_lng DOUBLE PRECISION,
  last_location_time TIMESTAMPTZ,
  battery_level INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ケア担当者テーブル
CREATE TABLE IF NOT EXISTS caregivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  notification_methods TEXT[] DEFAULT ARRAY['push'],
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ジオフェンステーブル
CREATE TABLE IF NOT EXISTS geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area_type TEXT NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  radius DOUBLE PRECISION NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- アラートテーブル
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 位置履歴テーブル
CREATE TABLE IF NOT EXISTS location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- セットアップ進行状況テーブル
CREATE TABLE IF NOT EXISTS setup_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  has_device BOOLEAN DEFAULT false,
  has_contacts BOOLEAN DEFAULT false,
  has_geofence BOOLEAN DEFAULT false,
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_caregivers_user_id ON caregivers(user_id);
CREATE INDEX IF NOT EXISTS idx_geofences_user_id ON geofences(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_device_id ON alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_location_history_device_id ON location_history(device_id);
CREATE INDEX IF NOT EXISTS idx_location_history_timestamp ON location_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_setup_progress_user_id ON setup_progress(user_id);

-- updated_at自動更新のトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー設定
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON devices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_caregivers_updated_at ON caregivers;
CREATE TRIGGER update_caregivers_updated_at
  BEFORE UPDATE ON caregivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_geofences_updated_at ON geofences;
CREATE TRIGGER update_geofences_updated_at
  BEFORE UPDATE ON geofences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alerts_updated_at ON alerts;
CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_setup_progress_updated_at ON setup_progress;
CREATE TRIGGER update_setup_progress_updated_at
  BEFORE UPDATE ON setup_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) を有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE setup_progress ENABLE ROW LEVEL SECURITY;

-- RLSポリシー（開発用に全アクセス許可 - 本番環境では適切に設定してください）
CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all access to devices" ON devices FOR ALL USING (true);
CREATE POLICY "Allow all access to caregivers" ON caregivers FOR ALL USING (true);
CREATE POLICY "Allow all access to geofences" ON geofences FOR ALL USING (true);
CREATE POLICY "Allow all access to alerts" ON alerts FOR ALL USING (true);
CREATE POLICY "Allow all access to location_history" ON location_history FOR ALL USING (true);
CREATE POLICY "Allow all access to setup_progress" ON setup_progress FOR ALL USING (true);
