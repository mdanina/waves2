-- Миграция: Система привязки устройств к лицензии с Trust Score
-- Дата: 2026-01-23

-- ============================================
-- 1. Расширение таблицы licenses для email-binding
-- ============================================

ALTER TABLE licenses ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS email_bound_at TIMESTAMPTZ;

-- Trust Score
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS trust_level VARCHAR(20) DEFAULT 'new'
  CHECK (trust_level IN ('new', 'standard', 'trusted'));
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS trust_level_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Статистика для детекции абьюза
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS total_unbinds_count INTEGER DEFAULT 0;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS last_unbind_at TIMESTAMPTZ;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS consecutive_limit_hits INTEGER DEFAULT 0;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS recent_regions TEXT[] DEFAULT '{}';

-- Индекс для поиска по email
CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(email);


-- ============================================
-- 2. Таблица привязанных устройств
-- ============================================

CREATE TABLE IF NOT EXISTS license_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,

  -- Идентификация устройства
  device_fingerprint VARCHAR(255) NOT NULL,
  device_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('mobile', 'tablet', 'desktop')),

  -- Статус привязки
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending_unbind', 'unbound')),
  unbind_requested_at TIMESTAMPTZ,
  unbind_available_at TIMESTAMPTZ,
  unbind_code_hash VARCHAR(255),  -- Хеш кода подтверждения
  unbind_code_expires_at TIMESTAMPTZ,

  -- Активность
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_region VARCHAR(100),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Уникальность: одно устройство может быть привязано к лицензии только один раз (в активном состоянии)
  UNIQUE(license_id, device_fingerprint, status)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_license_devices_license_id ON license_devices(license_id);
CREATE INDEX IF NOT EXISTS idx_license_devices_fingerprint ON license_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_license_devices_status ON license_devices(status);
CREATE INDEX IF NOT EXISTS idx_license_devices_last_active ON license_devices(last_active_at);


-- ============================================
-- 3. История отвязок (для аудита и подсчёта лимитов)
-- ============================================

CREATE TABLE IF NOT EXISTS device_unbind_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,

  -- Информация об устройстве
  device_fingerprint VARCHAR(255) NOT NULL,
  device_name VARCHAR(255) NOT NULL,

  -- Причина отвязки
  reason VARCHAR(50) NOT NULL
    CHECK (reason IN ('user_request', 'support', 'auto_inactive', 'suspicious')),

  -- Метаданные
  ip_address VARCHAR(45),
  user_agent TEXT,

  unbound_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекс для подсчёта отвязок за период (rolling 30 дней)
CREATE INDEX IF NOT EXISTS idx_unbind_history_license_date
  ON device_unbind_history(license_id, unbound_at DESC);


-- ============================================
-- 4. Таблица кодов подтверждения (для отвязки)
-- ============================================

CREATE TABLE IF NOT EXISTS unbind_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_device_id UUID NOT NULL REFERENCES license_devices(id) ON DELETE CASCADE,

  code_hash VARCHAR(255) NOT NULL,  -- bcrypt hash
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_unbind_codes_device
  ON unbind_verification_codes(license_device_id);


-- ============================================
-- 5. RLS Policies (Row Level Security)
-- ============================================

-- Включаем RLS
ALTER TABLE license_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_unbind_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE unbind_verification_codes ENABLE ROW LEVEL SECURITY;

-- Пользователь видит только свои устройства
CREATE POLICY license_devices_select_own ON license_devices
  FOR SELECT
  USING (
    license_id IN (
      SELECT id FROM licenses WHERE user_id = auth.uid()
    )
  );

-- Пользователь может добавлять устройства к своим лицензиям
CREATE POLICY license_devices_insert_own ON license_devices
  FOR INSERT
  WITH CHECK (
    license_id IN (
      SELECT id FROM licenses WHERE user_id = auth.uid()
    )
  );

-- Пользователь может обновлять статус своих устройств
CREATE POLICY license_devices_update_own ON license_devices
  FOR UPDATE
  USING (
    license_id IN (
      SELECT id FROM licenses WHERE user_id = auth.uid()
    )
  );

-- История отвязок - только чтение своих
CREATE POLICY unbind_history_select_own ON device_unbind_history
  FOR SELECT
  USING (
    license_id IN (
      SELECT id FROM licenses WHERE user_id = auth.uid()
    )
  );


-- ============================================
-- 6. Функции
-- ============================================

-- Функция подсчёта отвязок за последние 30 дней
CREATE OR REPLACE FUNCTION count_unbinds_last_30_days(p_license_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM device_unbind_history
    WHERE license_id = p_license_id
      AND unbound_at > NOW() - INTERVAL '30 days'
      AND reason = 'user_request'  -- Только пользовательские отвязки считаются в лимит
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Функция подсчёта активных устройств
CREATE OR REPLACE FUNCTION count_active_devices(p_license_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM license_devices
    WHERE license_id = p_license_id
      AND status IN ('active', 'pending_unbind')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Функция проверки возможности добавления устройства
CREATE OR REPLACE FUNCTION can_add_device(p_license_id UUID, p_max_devices INTEGER DEFAULT 3)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN count_active_devices(p_license_id) < p_max_devices;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Функция проверки возможности отвязки
CREATE OR REPLACE FUNCTION can_unbind_device(
  p_license_id UUID,
  p_device_id UUID,
  p_unbinds_per_month INTEGER
)
RETURNS TABLE(
  can_unbind BOOLEAN,
  reason TEXT,
  cooldown_ends_at TIMESTAMPTZ,
  unbinds_remaining INTEGER
) AS $$
DECLARE
  v_device license_devices%ROWTYPE;
  v_unbinds_count INTEGER;
  v_active_count INTEGER;
  v_last_unbind TIMESTAMPTZ;
BEGIN
  -- Получаем устройство
  SELECT * INTO v_device FROM license_devices WHERE id = p_device_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'device_not_found'::TEXT, NULL::TIMESTAMPTZ, 0;
    RETURN;
  END IF;

  -- Проверяем, не в процессе ли уже отвязка
  IF v_device.status = 'pending_unbind' THEN
    RETURN QUERY SELECT FALSE, 'pending_unbind'::TEXT, v_device.unbind_available_at, 0;
    RETURN;
  END IF;

  -- Проверяем, не последнее ли это устройство
  v_active_count := count_active_devices(p_license_id);
  IF v_active_count <= 1 THEN
    RETURN QUERY SELECT FALSE, 'last_device'::TEXT, NULL::TIMESTAMPTZ, 0;
    RETURN;
  END IF;

  -- Проверяем лимит отвязок
  v_unbinds_count := count_unbinds_last_30_days(p_license_id);
  IF v_unbinds_count >= p_unbinds_per_month THEN
    -- Находим, когда сбросится лимит
    SELECT unbound_at + INTERVAL '30 days' INTO v_last_unbind
    FROM device_unbind_history
    WHERE license_id = p_license_id
      AND reason = 'user_request'
    ORDER BY unbound_at ASC
    LIMIT 1;

    RETURN QUERY SELECT FALSE, 'limit_reached'::TEXT, v_last_unbind, 0;
    RETURN;
  END IF;

  -- Всё ок
  RETURN QUERY SELECT TRUE, NULL::TEXT, NULL::TIMESTAMPTZ, (p_unbinds_per_month - v_unbinds_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 7. Триггер для автоматического обновления Trust Level
-- ============================================

CREATE OR REPLACE FUNCTION update_trust_level()
RETURNS TRIGGER AS $$
DECLARE
  v_months_active INTEGER;
  v_new_trust_level VARCHAR(20);
BEGIN
  -- Вычисляем месяцы с момента привязки email
  v_months_active := EXTRACT(MONTH FROM AGE(NOW(), NEW.email_bound_at));

  -- Определяем новый уровень доверия
  IF v_months_active >= 3 AND NEW.consecutive_limit_hits < 3 THEN
    v_new_trust_level := 'trusted';
  ELSIF v_months_active >= 1 THEN
    v_new_trust_level := 'standard';
  ELSE
    v_new_trust_level := 'new';
  END IF;

  -- Понижение при подозрительной активности
  IF NEW.consecutive_limit_hits >= 3 OR array_length(NEW.recent_regions, 1) > 3 THEN
    v_new_trust_level := 'new';
  END IF;

  -- Обновляем если изменился
  IF v_new_trust_level != NEW.trust_level THEN
    NEW.trust_level := v_new_trust_level;
    NEW.trust_level_updated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_trust_level
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_level();


-- ============================================
-- 8. Cron job для автоотвязки неактивных (через pg_cron или внешний сервис)
-- ============================================

-- Эта функция должна вызываться ежедневно
CREATE OR REPLACE FUNCTION auto_unbind_inactive_devices()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Отвязываем устройства неактивные более 90 дней
  WITH unbound AS (
    UPDATE license_devices
    SET status = 'unbound'
    WHERE status = 'active'
      AND last_active_at < NOW() - INTERVAL '90 days'
    RETURNING id, license_id, device_fingerprint, device_name
  )
  INSERT INTO device_unbind_history (license_id, device_fingerprint, device_name, reason)
  SELECT license_id, device_fingerprint, device_name, 'auto_inactive'
  FROM unbound;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 9. Завершение отложенных отвязок (вызывать периодически)
-- ============================================

CREATE OR REPLACE FUNCTION complete_pending_unbinds()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  WITH completed AS (
    UPDATE license_devices
    SET status = 'unbound'
    WHERE status = 'pending_unbind'
      AND unbind_available_at <= NOW()
    RETURNING id, license_id, device_fingerprint, device_name
  )
  INSERT INTO device_unbind_history (license_id, device_fingerprint, device_name, reason)
  SELECT license_id, device_fingerprint, device_name, 'user_request'
  FROM completed;

  -- Обновляем счётчик отвязок в лицензии
  UPDATE licenses l
  SET
    total_unbinds_count = total_unbinds_count + 1,
    last_unbind_at = NOW()
  WHERE id IN (
    SELECT DISTINCT license_id
    FROM license_devices
    WHERE status = 'unbound'
      AND unbind_available_at <= NOW()
      AND unbind_available_at > NOW() - INTERVAL '1 minute'
  );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
