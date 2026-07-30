-- WASSUP Station OS - Complete Database Migration
-- Version: 3.0
-- Created At: 2026-07-08

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 3.1 ENUMS & CANONICAL STATE MANAGEMENT
-- ==========================================
CREATE TYPE order_commerce_status AS ENUM ('draft', 'pending_payment', 'paid', 'cancelled', 'closed');
CREATE TYPE wo_status AS ENUM ('queued', 'assigned', 'in_progress', 'quality_check', 'rework', 'done');
CREATE TYPE voucher_type AS ENUM ('percent', 'fixed_amount');

-- ==========================================
-- CORE ENTITIES
-- ==========================================

-- 1. Customers Table (CRM)
CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  phone           VARCHAR(15) UNIQUE NOT NULL,
  license_plate   VARCHAR(20),
  points          INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Staff Table (HR & RBAC)
CREATE TABLE staff (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  phone           VARCHAR(15) UNIQUE NOT NULL,
  role            VARCHAR(20) NOT NULL, -- 'master_admin', 'manager', 'technician', 'accountant'
  status          VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'inactive'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Booths Table
CREATE TABLE booths (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(50) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'idle', -- 'idle', 'busy', 'maintenance'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Services Table
CREATE TABLE services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(20) UNIQUE NOT NULL, -- 'W0', 'W1', 'W2', 'ADD_01'
  name            VARCHAR(100) NOT NULL,
  type            VARCHAR(20) NOT NULL, -- 'package', 'addon'
  price           BIGINT NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Orders Table (Commerce State)
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID REFERENCES customers(id),
  license_plate   VARCHAR(20) NOT NULL,
  vehicle_segment VARCHAR(20) NOT NULL, -- 'sedan', 'suv', 'truck'
  package_code    VARCHAR(20) NOT NULL, -- e.g. 'W0'-'W5'
  subtotal        BIGINT NOT NULL DEFAULT 0,
  discount        BIGINT NOT NULL DEFAULT 0,
  total           BIGINT NOT NULL DEFAULT 0,
  status          order_commerce_status NOT NULL DEFAULT 'draft',
  booth_id        UUID REFERENCES booths(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Work Orders Table (Canonical Operation State)
CREATE TABLE work_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  status              wo_status NOT NULL DEFAULT 'queued',
  technician_id       UUID REFERENCES staff(id),
  booth_id            UUID REFERENCES booths(id),
  rework_count        INT NOT NULL DEFAULT 0,
  estimated_duration  INT NOT NULL DEFAULT 30, -- minutes
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT max_rework_check CHECK (rework_count <= 2)
);

-- 7. Work Order Events (Operations Ledger)
CREATE TABLE work_order_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  status          wo_status NOT NULL,
  actor_id        UUID REFERENCES staff(id),
  channel         VARCHAR(10) NOT NULL DEFAULT 'web', -- 'web' | 'telegram' | 'system'
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 3.2 VOUCHERS (SINGLE-USE PERSONALIZED)
-- ==========================================
CREATE TABLE vouchers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  code            VARCHAR(30) UNIQUE NOT NULL,
  type            voucher_type NOT NULL,
  value           BIGINT NOT NULL,
  max_discount    BIGINT NULL,              -- max discount cap if type=percent
  min_order_value BIGINT DEFAULT 0,
  valid_from      TIMESTAMPTZ NOT NULL,
  valid_to        TIMESTAMPTZ NOT NULL,
  used_at         TIMESTAMPTZ NULL,          -- NULL = unused
  order_id        UUID NULL REFERENCES orders(id),  -- referenced order
  source          TEXT NOT NULL,             -- 'sup_redeem' | 'manual_grant' | 'birthday' | 'compensation'
  issued_by       UUID NULL REFERENCES staff(id),   -- NULL if system generated
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vouchers_customer ON vouchers(customer_id) WHERE used_at IS NULL;

-- Stored Procedure: Apply Voucher with Row Locking
CREATE OR REPLACE FUNCTION apply_voucher(
  p_voucher_code VARCHAR, 
  p_order_id UUID, 
  p_customer_id UUID, 
  p_subtotal BIGINT
)
RETURNS BIGINT AS $$
DECLARE
  v_voucher vouchers%ROWTYPE;
  v_discount BIGINT;
BEGIN
  -- Row level lock to prevent concurrent double-application race conditions
  SELECT * INTO v_voucher FROM vouchers
    WHERE code = p_voucher_code AND customer_id = p_customer_id
    FOR UPDATE;

  IF v_voucher.id IS NULL THEN
    RAISE EXCEPTION 'VOUCHER_NOT_FOUND';
  END IF;
  IF v_voucher.used_at IS NOT NULL THEN
    RAISE EXCEPTION 'VOUCHER_ALREADY_USED';
  END IF;
  IF NOW() < v_voucher.valid_from OR NOW() > v_voucher.valid_to THEN
    RAISE EXCEPTION 'VOUCHER_EXPIRED';
  END IF;
  IF p_subtotal < v_voucher.min_order_value THEN
    RAISE EXCEPTION 'ORDER_TOO_SMALL';
  END IF;

  v_discount := CASE
    WHEN v_voucher.type = 'fixed_amount' THEN v_voucher.value
    ELSE LEAST(p_subtotal * v_voucher.value / 100, COALESCE(v_voucher.max_discount, p_subtotal))
  END;

  UPDATE vouchers SET used_at = NOW(), order_id = p_order_id WHERE id = v_voucher.id;

  RETURN v_discount;
END;
$$ LANGUAGE plpgsql;

-- Trigger to release/refund voucher if order is cancelled
CREATE OR REPLACE FUNCTION refund_voucher_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE vouchers SET used_at = NULL, order_id = NULL WHERE order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refund_voucher
AFTER UPDATE OF status ON orders
FOR EACH ROW
WHEN (NEW.status = 'cancelled')
EXECUTE FUNCTION refund_voucher_on_cancel();


-- ==========================================
-- 3.3 TELEGRAM LINKS & NOTIFICATIONS
-- ==========================================
CREATE TABLE telegram_links (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id       UUID NOT NULL REFERENCES staff(id),
  chat_id        TEXT NOT NULL,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  linked_at      TIMESTAMPTZ NULL,
  linked_by      UUID NULL REFERENCES staff(id)
);


-- ==========================================
-- 3.5 AUXILIARY & OPERATIONAL TABLES
-- ==========================================

-- 1. Work Order Notes (KTV Notes log)
CREATE TABLE work_order_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  staff_id        UUID NOT NULL REFERENCES staff(id),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Work Order Ratings (Customer Feedback)
CREATE TABLE work_order_ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  rating          INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Revenue Thresholds (Dashboard configurations)
CREATE TABLE revenue_thresholds (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_target    BIGINT NOT NULL DEFAULT 50000000, -- 50M VND
  warning_level   BIGINT NOT NULL DEFAULT 35000000, -- 35M VND
  updated_by      UUID REFERENCES staff(id),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Shifts (POS shifting ledger)
CREATE TABLE shifts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id      UUID NOT NULL REFERENCES staff(id),
  start_time      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time        TIMESTAMPTZ,
  opening_cash    BIGINT NOT NULL DEFAULT 0,
  closing_cash    BIGINT,
  actual_cash     BIGINT,
  status          VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open' | 'closed'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Shift Handovers
CREATE TABLE shift_handovers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id            UUID NOT NULL REFERENCES shifts(id),
  outgoing_cashier_id UUID NOT NULL REFERENCES staff(id),
  incoming_cashier_id UUID NOT NULL REFERENCES staff(id),
  counted_cash        BIGINT NOT NULL,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Deposits
CREATE TABLE deposits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id),
  amount          BIGINT NOT NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Order Adjustments (Immutable edits tracker)
CREATE TABLE order_adjustments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id),
  adjusted_by     UUID NOT NULL REFERENCES staff(id),
  amount          BIGINT NOT NULL, -- positive or negative adjusting amount
  reason          TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Price Change Requests (Modules 5)
CREATE TABLE price_change_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id      UUID NOT NULL REFERENCES services(id),
  proposed_price  BIGINT NOT NULL,
  requested_by    UUID NOT NULL REFERENCES staff(id),
  approved_by     UUID REFERENCES staff(id),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Tool Depreciation
CREATE TABLE tool_depreciation (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name         VARCHAR(100) NOT NULL,
  purchase_cost     BIGINT NOT NULL,
  depreciation_rate FLOAT NOT NULL, -- percentage per year (e.g. 15.5)
  current_value     BIGINT NOT NULL,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Inventory Items (CRM Material management)
CREATE TABLE inventory_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku             VARCHAR(50) UNIQUE NOT NULL,
  name            VARCHAR(100) NOT NULL,
  category        VARCHAR(20) NOT NULL, -- 'commercial' | 'consumable' | 'tool'
  unit            VARCHAR(20) NOT NULL, -- e.g. 'bottle', 'litre', 'piece'
  min_stock       INT NOT NULL DEFAULT 5,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Inventory Levels
CREATE TABLE inventory_levels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity        INT NOT NULL DEFAULT 0,
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Camera Feed Registry (Phase 2 placeholder)
CREATE TABLE cameras (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(50) NOT NULL,
  stream_url      TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'offline',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Sensor Telemetry (Phase 2 placeholder)
CREATE TABLE sensors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(50) NOT NULL,
  type            VARCHAR(30) NOT NULL, -- 'temperature' | 'humidity' | 'water_pressure'
  current_value   VARCHAR(50),
  status          VARCHAR(20) NOT NULL DEFAULT 'offline',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Emergency Stop Log (Safety audit)
CREATE TABLE emergency_stop_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by    VARCHAR(100) NOT NULL,
  reason          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==========================================
-- UNIFIED CANONICAL VIEW
-- ==========================================
CREATE OR REPLACE VIEW order_status_view AS
SELECT
  o.id AS order_id,
  o.customer_id,
  c.name AS customer_name,
  c.phone AS customer_phone,
  o.license_plate,
  o.vehicle_segment,
  o.package_code,
  o.total,
  o.status AS commerce_status,
  wo.id AS work_order_id,
  wo.status AS work_order_status,
  wo.technician_id,
  s.name AS technician_name,
  wo.booth_id,
  b.name AS booth_name,
  wo.rework_count,
  wo.estimated_duration,
  wo.started_at,
  wo.completed_at,
  o.created_at AS order_created_at
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN work_orders wo ON o.id = wo.order_id
LEFT JOIN staff s ON wo.technician_id = s.id
LEFT JOIN booths b ON wo.booth_id = b.id;


-- ==========================================
-- SEED SAMPLE DATA (WASSUP STARTUP PRESET)
-- ==========================================

-- Staff Roles
INSERT INTO staff (id, name, phone, role, status) VALUES
  ('a0a0a0a0-0000-4000-a000-000000000001', 'Master Admin', '0901234567', 'master_admin', 'active'),
  ('a0a0a0a0-0000-4000-a000-000000000002', 'Nguyen Manager', '0911234567', 'manager', 'active'),
  ('a0a0a0a0-0000-4000-a000-000000000003', 'Tran Technician 1', '0921234567', 'technician', 'active'),
  ('a0a0a0a0-0000-4000-a000-000000000004', 'Pham Technician 2', '0931234567', 'technician', 'active'),
  ('a0a0a0a0-0000-4000-a000-000000000005', 'Le Accountant', '0941234567', 'accountant', 'active');

-- Service Packages & Addons
INSERT INTO services (id, code, name, type, price, description) VALUES
  ('s0000000-0000-4000-b000-000000000000', 'W0', 'Washing basic', 'package', 100000, 'Basic water wash and hand dry'),
  ('s0000000-0000-4000-b000-000000000001', 'W1', 'Washing Silver', 'package', 150000, 'Water wash, active foam & tire care'),
  ('s0000000-0000-4000-b000-000000000002', 'W2', 'Washing Gold', 'package', 250000, 'Silver care + interior vacuuming & dust polish'),
  ('s0000000-0000-4000-b000-000000000003', 'W3', 'Washing Platinum', 'package', 450000, 'Gold care + undercarriage wash & engine details'),
  ('s0000000-0000-4000-b000-000000000004', 'W4', 'Ceramic Polish', 'package', 1200000, 'Platinum care + premium quick ceramic coating'),
  ('s0000000-0000-4000-b000-000000000005', 'W5', 'Full Detailing', 'package', 3500000, 'Ultimate premium detailing, leather care, and engine polish'),
  ('s0000000-0000-4000-b000-000000000006', 'ADD01', 'Rain Repellent', 'addon', 50000, 'Windshield rain repellent application'),
  ('s0000000-0000-4000-b000-000000000007', 'ADD02', 'Odor Eliminator', 'addon', 80000, 'Active ozone cabin sanitizing & deodorizing');

-- Booths Setup
INSERT INTO booths (id, name, status) VALUES
  ('b0000000-0000-4000-c000-000000000001', 'Wash Bay A', 'idle'),
  ('b0000000-0000-4000-c000-000000000002', 'Wash Bay B', 'idle'),
  ('b0000000-0000-4000-c000-000000000003', 'Detailing Bay C', 'idle'),
  ('b0000000-0000-4000-c000-000000000004', 'Quality Check Bay', 'idle');

-- Revenue Target Threshold Setup
INSERT INTO revenue_thresholds (id, daily_target, warning_level, updated_at) VALUES
  ('r0000000-0000-4000-d000-000000000001', 50000000, 35000000, NOW());

-- Add a default customer
INSERT INTO customers (id, name, phone, license_plate, points) VALUES
  ('c0000000-0000-4000-e000-000000000001', 'Anh Quan', '0999888777', '30A-123.45', 150);

-- Generate some initial sample orders & work orders
INSERT INTO orders (id, customer_id, license_plate, vehicle_segment, package_code, subtotal, discount, total, status, booth_id, created_at) VALUES
  ('00000000-0000-4000-f000-000000000001', 'c0000000-0000-4000-e000-000000000001', '30A-123.45', 'suv', 'W2', 250000, 0, 250000, 'paid', 'b0000000-0000-4000-c000-000000000001', NOW() - INTERVAL '15 minutes'),
  ('00000000-0000-4000-f000-000000000002', NULL, '51G-999.99', 'sedan', 'W1', 150000, 0, 150000, 'pending_payment', 'b0000000-0000-4000-c000-000000000002', NOW() - INTERVAL '5 minutes');

INSERT INTO work_orders (id, order_id, status, technician_id, booth_id, rework_count, estimated_duration, started_at, created_at) VALUES
  ('10000000-0000-4000-0000-000000000001', '00000000-0000-4000-f000-000000000001', 'in_progress', 'a0a0a0a0-0000-4000-a000-000000000003', 'b0000000-0000-4000-c000-000000000001', 0, 30, NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '15 minutes'),
  ('10000000-0000-4000-0000-000000000002', '00000000-0000-4000-f000-000000000002', 'assigned', 'a0a0a0a0-0000-4000-a000-000000000004', 'b0000000-0000-4000-c000-000000000002', 0, 25, NULL, NOW() - INTERVAL '5 minutes');

-- Populate inventory items
INSERT INTO inventory_items (id, sku, name, category, unit, min_stock) VALUES
  ('i0000000-0000-4000-1000-000000000001', 'FOAM-01', 'Premium Active Foam Soap', 'consumable', 'litre', 10),
  ('i0000000-0000-4000-1000-000000000002', 'WAX-GOLD', 'Gold Carnauba Liquid Wax', 'consumable', 'bottle', 3),
  ('i0000000-0000-4000-1000-000000000003', 'WASH-MTR', 'Standard Pressure Washer Wand', 'tool', 'piece', 2),
  ('i0000000-0000-4000-1000-000000000004', 'M-FIBER', 'Microfiber Absorbent Towels', 'commercial', 'piece', 50);

INSERT INTO inventory_levels (item_id, quantity) VALUES
  ('i0000000-0000-4000-1000-000000000001', 45),
  ('i0000000-0000-4000-1000-000000000002', 12),
  ('i0000000-0000-4000-1000-000000000003', 4),
  ('i0000000-0000-4000-1000-000000000004', 120);

-- ==========================================
-- ATOMIC KIOSK FLOW SYNC RPC
-- ==========================================
CREATE OR REPLACE FUNCTION create_kiosk_order_v2(
  p_phone VARCHAR,
  p_name VARCHAR,
  p_license_plate VARCHAR,
  p_vehicle_segment VARCHAR,
  p_package_code VARCHAR,
  p_subtotal BIGINT,
  p_discount BIGINT,
  p_total BIGINT,
  p_booth_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_customer_id UUID := NULL;
  v_order_id UUID;
  v_work_order_id UUID;
  v_technician_id UUID := NULL;
  v_points_added INT;
  v_response JSON;
BEGIN
  -- 1. Manage Customer record and points if phone is provided
  IF p_phone IS NOT NULL AND p_phone <> '' THEN
    v_points_added := floor(p_total * 0.001);
    SELECT id INTO v_customer_id FROM customers WHERE phone = p_phone;
    
    IF v_customer_id IS NULL THEN
      INSERT INTO customers (name, phone, license_plate, points)
      VALUES (COALESCE(p_name, 'Khách mới'), p_phone, p_license_plate, v_points_added)
      RETURNING id INTO v_customer_id;
    ELSE
      UPDATE customers 
      SET points = points + v_points_added,
          name = COALESCE(p_name, name),
          license_plate = COALESCE(p_license_plate, license_plate)
      WHERE id = v_customer_id;
    END IF;
  END IF;

  -- 2. Create the order
  INSERT INTO orders (customer_id, license_plate, vehicle_segment, package_code, subtotal, discount, total, status, booth_id)
  VALUES (v_customer_id, p_license_plate, p_vehicle_segment, p_package_code, p_subtotal, p_discount, p_total, 'paid', p_booth_id)
  RETURNING id INTO v_order_id;

  -- 3. Determine technician if booth_id is supplied
  IF p_booth_id IS NOT NULL THEN
    SELECT id INTO v_technician_id 
    FROM staff 
    WHERE role = 'technician' AND status = 'active' 
    LIMIT 1;
  END IF;

  -- 4. Create the corresponding Work Order
  INSERT INTO work_orders (order_id, status, technician_id, booth_id, rework_count, estimated_duration)
  VALUES (
    v_order_id, 
    CASE WHEN p_booth_id IS NOT NULL THEN 'assigned'::wo_status ELSE 'queued'::wo_status END, 
    v_technician_id, 
    p_booth_id, 
    0, 
    30
  )
  RETURNING id INTO v_work_order_id;

  -- 5. Mark booth as busy if assigned
  IF p_booth_id IS NOT NULL THEN
    UPDATE booths SET status = 'busy' WHERE id = p_booth_id;
  END IF;

  -- Build response JSON
  v_response := json_build_object(
    'order_id', v_order_id,
    'work_order_id', v_work_order_id,
    'customer_id', v_customer_id
  );

  RETURN v_response;
END;
$$ LANGUAGE plpgsql;

