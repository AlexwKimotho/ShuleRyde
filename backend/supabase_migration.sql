-- ============================================================
-- ShuleRyde — Supabase SQL Migration
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- OPERATORS (linked to Supabase auth.users)
CREATE TABLE operators (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT UNIQUE NOT NULL,
  full_name           TEXT NOT NULL,
  business_name       TEXT NOT NULL,
  phone               TEXT NOT NULL,
  mpesa_paybill       TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'ACTIVE',
  suspension_date     TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX operators_email_idx ON operators(email);

-- VEHICLES
CREATE TABLE vehicles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id   UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  license_plate TEXT NOT NULL,
  model         TEXT NOT NULL,
  route         TEXT,
  max_capacity  INTEGER NOT NULL DEFAULT 7,
  status        TEXT NOT NULL DEFAULT 'IDLE',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (operator_id, license_plate)
);

CREATE INDEX vehicles_operator_status_idx ON vehicles(operator_id, status);

-- PARENTS
CREATE TABLE parents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id   UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT,
  unique_url_id TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX parents_operator_id_idx ON parents(operator_id);
CREATE INDEX parents_phone_idx ON parents(phone);

-- CHILDREN
CREATE TABLE children (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id        UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  vehicle_id       UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  full_name        TEXT NOT NULL,
  school_name      TEXT,
  pickup_location  TEXT,
  dropoff_location TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX children_parent_id_idx ON children(parent_id);
CREATE INDEX children_vehicle_id_idx ON children(vehicle_id);

-- PAYMENTS
CREATE TABLE payments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id            UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  amount               DECIMAL NOT NULL,
  amount_collected     DECIMAL NOT NULL DEFAULT 0,
  status               TEXT NOT NULL DEFAULT 'PENDING',
  payment_date         TIMESTAMPTZ,
  payment_method       TEXT,
  mpesa_transaction_id TEXT,
  invoice_month        TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX payments_parent_status_idx ON payments(parent_id, status);
CREATE INDEX payments_invoice_month_idx ON payments(invoice_month);

-- COMPLIANCE DOCUMENTS
CREATE TABLE compliance_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id   UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  vehicle_id    UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id     UUID,
  document_type TEXT NOT NULL,
  issue_date    TIMESTAMPTZ NOT NULL,
  expiry_date   TIMESTAMPTZ NOT NULL,
  file_url      TEXT NOT NULL,
  status        TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX compliance_docs_operator_expiry_idx ON compliance_documents(operator_id, expiry_date);
CREATE INDEX compliance_docs_vehicle_status_idx ON compliance_documents(vehicle_id, status);

-- COMPLIANCE ALERTS
CREATE TABLE compliance_alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES compliance_documents(id) ON DELETE CASCADE,
  alert_type   TEXT NOT NULL,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX compliance_alerts_doc_type_idx ON compliance_alerts(document_id, alert_type);

-- CHECK-INS
CREATE TABLE check_ins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  vehicle_id   UUID NOT NULL,
  checkin_type TEXT NOT NULL,
  checkin_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location_lat DECIMAL,
  location_lng DECIMAL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX checkins_child_time_idx ON check_ins(child_id, checkin_time);

-- ACTIVITY LOGS
CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  vehicle_id  UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  event_type  TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata    TEXT,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX activity_logs_operator_time_idx ON activity_logs(operator_id, timestamp);
CREATE INDEX activity_logs_event_type_idx ON activity_logs(event_type);

-- ============================================================
-- RLS POLICIES
-- The backend uses the service-role key which bypasses RLS.
-- These policies protect direct client-side / dashboard access.
-- Run ALTER TABLE ... ENABLE ROW LEVEL SECURITY only if you
-- enabled RLS via the Supabase dashboard (it causes the RLS
-- error on signup when no policies are defined).
-- ============================================================

ALTER TABLE operators            ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE children             ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins            ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs        ENABLE ROW LEVEL SECURITY;

-- Operators: each user can only access their own row
CREATE POLICY "operators_select_own" ON operators FOR SELECT USING (auth.uid() = id);
CREATE POLICY "operators_insert_own" ON operators FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "operators_update_own" ON operators FOR UPDATE USING (auth.uid() = id);

-- All operator-scoped tables: restrict to rows owned by the authenticated operator
CREATE POLICY "vehicles_operator"  ON vehicles             USING (operator_id = auth.uid());
CREATE POLICY "parents_operator"   ON parents              USING (operator_id = auth.uid());
CREATE POLICY "pricing_operator"   ON pricing_configs      USING (operator_id = auth.uid());
CREATE POLICY "compliance_operator" ON compliance_documents USING (operator_id = auth.uid());
CREATE POLICY "activity_operator"  ON activity_logs        USING (operator_id = auth.uid());

-- Children: accessible when the parent belongs to the authenticated operator
CREATE POLICY "children_operator" ON children
  USING (parent_id IN (SELECT id FROM parents WHERE operator_id = auth.uid()));

-- Payments: accessible when the parent belongs to the authenticated operator
CREATE POLICY "payments_operator" ON payments
  USING (parent_id IN (SELECT id FROM parents WHERE operator_id = auth.uid()));

-- Compliance alerts: accessible when the document belongs to the authenticated operator
CREATE POLICY "compliance_alerts_operator" ON compliance_alerts
  USING (document_id IN (SELECT id FROM compliance_documents WHERE operator_id = auth.uid()));

-- Check-ins: accessible when the child belongs to the authenticated operator
CREATE POLICY "checkins_operator" ON check_ins
  USING (child_id IN (
    SELECT c.id FROM children c
    JOIN parents p ON c.parent_id = p.id
    WHERE p.operator_id = auth.uid()
  ));

-- PRICING CONFIG
CREATE TABLE pricing_configs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id       UUID UNIQUE NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  model_type        TEXT NOT NULL DEFAULT 'PER_STUDENT',
  vehicle_base_rate DECIMAL,
  per_student_rate  DECIMAL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE pricing_configs ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_operators_updated_at    BEFORE UPDATE ON operators            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_vehicles_updated_at     BEFORE UPDATE ON vehicles             FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_parents_updated_at      BEFORE UPDATE ON parents              FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_children_updated_at     BEFORE UPDATE ON children             FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payments_updated_at     BEFORE UPDATE ON payments             FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_compliance_updated_at   BEFORE UPDATE ON compliance_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pricing_updated_at      BEFORE UPDATE ON pricing_configs      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PATCHES — run these if the initial migration was applied
-- before these columns/tables were added
-- ============================================================

-- Patch: add amount_collected to payments if missing
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_collected DECIMAL NOT NULL DEFAULT 0;
