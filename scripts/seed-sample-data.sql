-- デモユーザーを作成
INSERT INTO users (id, email, display_name, created_at, updated_at)
VALUES 
  ('demo-user-001', 'demo@example.com', 'デモユーザー', NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email, display_name = EXCLUDED.display_name, updated_at = NOW();

-- セットアップ進行状況を初期化
INSERT INTO setup_progress (user_id, has_device, has_contacts, has_geofence, is_complete, created_at, updated_at)
VALUES 
  ('demo-user-001', true, true, true, true, NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE
SET has_device = true, has_contacts = true, has_geofence = true, is_complete = true, updated_at = NOW();

-- デモデバイスを作成
INSERT INTO devices (id, user_id, device_name, device_type, phone_number, battery_level, is_active, last_location_lat, last_location_lng, last_location_time, created_at, updated_at)
VALUES 
  ('demo-device-001', 'demo-user-001', 'メインデバイス', 'smartphone', '090-1234-5678', 85, true, 35.6812, 139.7671, NOW(), NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET 
  device_name = EXCLUDED.device_name,
  device_type = EXCLUDED.device_type,
  phone_number = EXCLUDED.phone_number,
  battery_level = EXCLUDED.battery_level,
  is_active = EXCLUDED.is_active,
  last_location_lat = EXCLUDED.last_location_lat,
  last_location_lng = EXCLUDED.last_location_lng,
  last_location_time = EXCLUDED.last_location_time,
  updated_at = NOW();

-- 連絡先（ケアギバー）を作成
INSERT INTO caregivers (user_id, name, relationship, phone_number, email, notification_enabled, priority, created_at, updated_at)
VALUES 
  ('demo-user-001', '緊急連絡先A', '家族', '090-1111-2222', 'contact-a@example.com', true, 1, NOW(), NOW()),
  ('demo-user-001', '緊急連絡先B', '介護士', '080-3333-4444', 'contact-b@example.com', true, 2, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 安全エリア（ジオフェンス）を作成
INSERT INTO geofences (user_id, name, area_type, center_lat, center_lng, radius, is_active, created_at, updated_at)
VALUES 
  ('demo-user-001', '自宅エリア', 'safe', 35.6812, 139.7671, 500, true, NOW(), NOW()),
  ('demo-user-001', '近隣エリア', 'safe', 35.6850, 139.7700, 1000, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- サンプル位置履歴を作成（過去24時間）
INSERT INTO location_history (device_id, latitude, longitude, accuracy, timestamp, created_at)
SELECT 
  'demo-device-001',
  35.6812 + (random() - 0.5) * 0.01,
  139.7671 + (random() - 0.5) * 0.01,
  10 + random() * 20,
  NOW() - (interval '1 hour' * generate_series(0, 23)),
  NOW()
FROM generate_series(0, 23)
ON CONFLICT DO NOTHING;

-- サンプルアラートを作成
INSERT INTO alerts (user_id, device_id, alert_type, severity, message, location_lat, location_lng, is_resolved, created_at, updated_at)
VALUES 
  ('demo-user-001', 'demo-device-001', 'geofence_exit', 'medium', '自宅エリアから離れました', 35.6900, 139.7750, true, NOW() - interval '2 hours', NOW()),
  ('demo-user-001', 'demo-device-001', 'low_battery', 'low', 'バッテリー残量が20%を下回りました', 35.6812, 139.7671, false, NOW() - interval '30 minutes', NOW())
ON CONFLICT DO NOTHING;
