-- ============================================
-- DentaCare Pro - Schema Additions
-- Additional tables + missing indexes
-- ============================================

-- ============================================
-- 19. CLINIC SETTINGS (key-value config)
-- ============================================
CREATE TABLE clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  UNIQUE(clinic_id, key)
);

ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON clinic_settings FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- ============================================
-- 20. AUDIT LOG (medical data compliance)
-- ============================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_clinic ON audit_log(clinic_id);
CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_created ON audit_log(clinic_id, created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON audit_log FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- ============================================
-- MISSING INDEXES from first migration
-- ============================================
CREATE INDEX idx_stock_movements_inventory ON stock_movements(inventory_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(clinic_id, date);
CREATE INDEX idx_maintenance_records_equipment ON maintenance_records(equipment_id);
CREATE INDEX idx_maintenance_records_date ON maintenance_records(clinic_id, date);
CREATE INDEX idx_salary_records_employee_month ON salary_records(employee_id, month);
CREATE INDEX idx_treatment_plans_patient ON treatment_plans(patient_id);
CREATE INDEX idx_procedures_clinic ON procedures(clinic_id);
CREATE INDEX idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);

-- ============================================
-- COMPOSITE INDEXES for dashboard queries
-- ============================================
-- Revenue this month
CREATE INDEX idx_payments_month ON payments(clinic_id, date, amount);
-- Overdue debts
CREATE INDEX idx_debts_overdue ON debts(clinic_id, status, due_date)
  WHERE status IN ('pending','partial','overdue');
-- Low stock alerts
CREATE INDEX idx_inventory_low_stock ON inventory(clinic_id, quantity, min_threshold)
  WHERE quantity <= min_threshold;
-- Upcoming maintenance
CREATE INDEX idx_equipment_maintenance ON equipment(clinic_id, next_maintenance)
  WHERE status = 'active';
