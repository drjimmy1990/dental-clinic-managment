-- ============================================
-- DentaCare Pro - Complete Database Schema
-- Multi-tenant dental clinic management system
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CLINICS (Tenants)
-- ============================================
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  doctor_name TEXT,
  phone TEXT,
  address TEXT,
  working_hours TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. USERS (Clinic Members)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','doctor','assistant','secretary','technician')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_clinic ON users(clinic_id);

-- ============================================
-- 3. PATIENTS
-- ============================================
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  code TEXT,
  full_name TEXT NOT NULL,
  phone TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male','female')),
  address TEXT,
  has_blood_pressure BOOLEAN DEFAULT false,
  has_diabetes BOOLEAN DEFAULT false,
  has_anesthesia_allergy BOOLEAN DEFAULT false,
  medical_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_name ON patients(clinic_id, full_name);
CREATE INDEX idx_patients_phone ON patients(clinic_id, phone);

-- ============================================
-- 4. DENTAL RECORDS (per tooth)
-- ============================================
CREATE TABLE dental_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  tooth_number INTEGER NOT NULL CHECK (tooth_number BETWEEN 11 AND 48),
  status TEXT NOT NULL DEFAULT 'healthy'
    CHECK (status IN ('healthy','filled','crowned','extracted','root_canal','needs_work')),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(patient_id, tooth_number)
);

CREATE INDEX idx_dental_patient ON dental_records(patient_id);

-- ============================================
-- 5. APPOINTMENTS
-- ============================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  type TEXT NOT NULL,
  chair_number INTEGER DEFAULT 1,
  status TEXT DEFAULT 'upcoming'
    CHECK (status IN ('upcoming','attended','postponed','cancelled','no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_appointments_clinic_date ON appointments(clinic_id, date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(clinic_id, status);

-- ============================================
-- 6. PROCEDURES
-- ============================================
CREATE TABLE procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  tooth_numbers INTEGER[],
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_procedures_patient ON procedures(patient_id);

-- ============================================
-- 7. TREATMENT PLANS
-- ============================================
CREATE TABLE treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 8. SUPPLIERS / LABS
-- ============================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('lab','supplier')),
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_suppliers_clinic ON suppliers(clinic_id);

-- ============================================
-- 9. PAYMENTS
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  procedure_id UUID REFERENCES procedures(id) ON DELETE SET NULL,
  treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  method TEXT DEFAULT 'cash'
    CHECK (method IN ('cash','card','vodafone','transfer')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_clinic_date ON payments(clinic_id, date);
CREATE INDEX idx_payments_patient ON payments(patient_id);

-- ============================================
-- 10. DEBTS
-- ============================================
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('patient_owes','clinic_owes')),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  remaining_amount DECIMAL(10,2) NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','partial','paid','overdue')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_debts_clinic ON debts(clinic_id);
CREATE INDEX idx_debts_patient ON debts(patient_id);
CREATE INDEX idx_debts_status ON debts(clinic_id, status);

-- ============================================
-- 11. LAB ORDERS
-- ============================================
CREATE TABLE lab_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  shade TEXT,
  tooth_numbers INTEGER[],
  sent_date DATE,
  expected_date DATE,
  received_date DATE,
  cost DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'at_lab'
    CHECK (status IN ('at_lab','ready','received','delayed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lab_orders_clinic ON lab_orders(clinic_id);
CREATE INDEX idx_lab_orders_status ON lab_orders(clinic_id, status);

-- ============================================
-- 12. INVENTORY
-- ============================================
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT,
  min_threshold INTEGER DEFAULT 5,
  cost_per_unit DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inventory_clinic ON inventory(clinic_id);

-- ============================================
-- 13. STOCK MOVEMENTS
-- ============================================
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in','out','adjustment')),
  quantity INTEGER NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 14. EQUIPMENT
-- ============================================
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  last_maintenance DATE,
  next_maintenance DATE,
  service_company TEXT,
  maintenance_cost DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active','needs_maintenance','under_maintenance','decommissioned')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_equipment_clinic ON equipment(clinic_id);

-- ============================================
-- 15. MAINTENANCE RECORDS
-- ============================================
CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  company TEXT,
  cost DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 16. EMPLOYEES
-- ============================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  base_salary DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_employees_clinic ON employees(clinic_id);

-- ============================================
-- 17. SALARY RECORDS
-- ============================================
CREATE TABLE salary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  base_amount DECIMAL(10,2) NOT NULL,
  bonuses DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  paid_date DATE,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','paid')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_salary_records_clinic ON salary_records(clinic_id);

-- ============================================
-- 18. EXPENSES
-- ============================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fixed','variable')),
  amount DECIMAL(10,2) NOT NULL,
  month DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_expenses_clinic ON expenses(clinic_id);
CREATE INDEX idx_expenses_month ON expenses(clinic_id, month);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Helper function: get current user's clinic_id
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE dental_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Clinics: users can only see their own clinic
CREATE POLICY "Users can view their clinic"
  ON clinics FOR SELECT
  USING (id = get_user_clinic_id());

CREATE POLICY "Owners can update their clinic"
  ON clinics FOR UPDATE
  USING (id = get_user_clinic_id());

-- Users: see members of own clinic
CREATE POLICY "Users can view clinic members"
  ON users FOR SELECT
  USING (clinic_id = get_user_clinic_id());

-- Macro: tenant isolation policy for all data tables
-- Pattern: SELECT/INSERT/UPDATE/DELETE scoped to clinic_id

-- Patients
CREATE POLICY "Tenant isolation" ON patients FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Dental Records
CREATE POLICY "Tenant isolation" ON dental_records FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Appointments
CREATE POLICY "Tenant isolation" ON appointments FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Procedures
CREATE POLICY "Tenant isolation" ON procedures FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Treatment Plans
CREATE POLICY "Tenant isolation" ON treatment_plans FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Suppliers
CREATE POLICY "Tenant isolation" ON suppliers FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Payments
CREATE POLICY "Tenant isolation" ON payments FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Debts
CREATE POLICY "Tenant isolation" ON debts FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Lab Orders
CREATE POLICY "Tenant isolation" ON lab_orders FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Inventory
CREATE POLICY "Tenant isolation" ON inventory FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Stock Movements
CREATE POLICY "Tenant isolation" ON stock_movements FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Equipment
CREATE POLICY "Tenant isolation" ON equipment FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Maintenance Records
CREATE POLICY "Tenant isolation" ON maintenance_records FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Employees
CREATE POLICY "Tenant isolation" ON employees FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Salary Records
CREATE POLICY "Tenant isolation" ON salary_records FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- Expenses
CREATE POLICY "Tenant isolation" ON expenses FOR ALL
  USING (clinic_id = get_user_clinic_id())
  WITH CHECK (clinic_id = get_user_clinic_id());

-- ============================================
-- SPECIAL: Allow clinic creation during signup
-- ============================================
CREATE POLICY "Anyone can create a clinic during signup"
  ON clinics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can insert themselves"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================
-- AUTO-GENERATE PATIENT CODE
-- ============================================
CREATE OR REPLACE FUNCTION generate_patient_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 3) AS INTEGER)), 0) + 1
  INTO next_num
  FROM patients
  WHERE clinic_id = NEW.clinic_id;

  NEW.code := 'P-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_patient_code
  BEFORE INSERT ON patients
  FOR EACH ROW
  WHEN (NEW.code IS NULL)
  EXECUTE FUNCTION generate_patient_code();

-- ============================================
-- AUTO-UPDATE updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_dental_records_updated_at BEFORE UPDATE ON dental_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
