// Database types for DentaCare Pro
// These mirror the Supabase schema exactly

export type UserRole = 'owner' | 'doctor' | 'assistant' | 'secretary' | 'technician';
export type Gender = 'male' | 'female';
export type ToothStatus = 'healthy' | 'filled' | 'crowned' | 'extracted' | 'root_canal' | 'needs_work';
export type AppointmentStatus = 'upcoming' | 'attended' | 'postponed' | 'cancelled' | 'no_show';
export type AppointmentType = 'كشف أولي' | 'حشو' | 'خلع' | 'تركيب تلبيسة' | 'علاج عصب' | 'تنظيف' | 'تقويم' | 'زراعة' | 'حشو جمالي';
export type PaymentMethod = 'cash' | 'card' | 'vodafone' | 'transfer';
export type DebtDirection = 'patient_owes' | 'clinic_owes';
export type DebtStatus = 'pending' | 'partial' | 'paid' | 'overdue';
export type LabOrderStatus = 'at_lab' | 'ready' | 'received' | 'delayed' | 'cancelled';
export type StockMovementType = 'in' | 'out' | 'adjustment';
export type EquipmentStatus = 'active' | 'needs_maintenance' | 'under_maintenance' | 'decommissioned';
export type SalaryStatus = 'pending' | 'paid';
export type ExpenseType = 'fixed' | 'variable';
export type SupplierType = 'lab' | 'supplier';
export type TreatmentPlanStatus = 'active' | 'completed' | 'cancelled';
export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface Clinic {
  id: string;
  name: string;
  doctor_name: string | null;
  phone: string | null;
  address: string | null;
  working_hours: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  clinic_id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  clinic_id: string;
  code: string | null;
  full_name: string;
  phone: string | null;
  age: number | null;
  gender: Gender | null;
  address: string | null;
  has_blood_pressure: boolean;
  has_diabetes: boolean;
  has_anesthesia_allergy: boolean;
  medical_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DentalRecord {
  id: string;
  clinic_id: string;
  patient_id: string;
  tooth_number: number;
  status: ToothStatus;
  notes: string | null;
  updated_at: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string | null;
  date: string;
  time: string;
  type: string;
  chair_number: number;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  // Joined
  patient?: Patient;
  doctor?: User;
}

export interface Procedure {
  id: string;
  clinic_id: string;
  appointment_id: string | null;
  patient_id: string;
  type: string;
  tooth_numbers: number[] | null;
  cost: number;
  notes: string | null;
  created_at: string;
}

export interface TreatmentPlan {
  id: string;
  clinic_id: string;
  patient_id: string;
  total_cost: number;
  total_paid: number;
  status: TreatmentPlanStatus;
  created_at: string;
}

export interface Supplier {
  id: string;
  clinic_id: string;
  name: string;
  type: SupplierType | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  clinic_id: string;
  patient_id: string;
  procedure_id: string | null;
  treatment_plan_id: string | null;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes: string | null;
  created_at: string;
  // Joined
  patient?: Patient;
}

export interface Debt {
  id: string;
  clinic_id: string;
  direction: DebtDirection;
  patient_id: string | null;
  supplier_id: string | null;
  total_amount: number;
  remaining_amount: number;
  due_date: string | null;
  status: DebtStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  patient?: Patient;
  supplier?: Supplier;
}

export interface LabOrder {
  id: string;
  clinic_id: string;
  patient_id: string;
  supplier_id: string | null;
  type: string;
  shade: string | null;
  tooth_numbers: number[] | null;
  sent_date: string | null;
  expected_date: string | null;
  received_date: string | null;
  cost: number;
  status: LabOrderStatus;
  notes: string | null;
  created_at: string;
  // Joined
  patient?: Patient;
  supplier?: Supplier;
}

export interface InventoryItem {
  id: string;
  clinic_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string | null;
  min_threshold: number;
  cost_per_unit: number;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  clinic_id: string;
  inventory_id: string;
  type: StockMovementType;
  quantity: number;
  date: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Equipment {
  id: string;
  clinic_id: string;
  name: string;
  last_maintenance: string | null;
  next_maintenance: string | null;
  service_company: string | null;
  maintenance_cost: number;
  status: EquipmentStatus;
  created_at: string;
}

export interface MaintenanceRecord {
  id: string;
  clinic_id: string;
  equipment_id: string;
  date: string;
  company: string | null;
  cost: number;
  notes: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  clinic_id: string;
  user_id: string | null;
  full_name: string;
  role: string;
  base_salary: number;
  is_active: boolean;
  created_at: string;
}

export interface SalaryRecord {
  id: string;
  clinic_id: string;
  employee_id: string;
  month: string;
  base_amount: number;
  bonuses: number;
  deductions: number;
  net_amount: number;
  paid_date: string | null;
  status: SalaryStatus;
  created_at: string;
  // Joined
  employee?: Employee;
}

export interface Expense {
  id: string;
  clinic_id: string;
  category: string;
  type: ExpenseType;
  amount: number;
  month: string;
  notes: string | null;
  created_at: string;
}

export interface ClinicSetting {
  id: string;
  clinic_id: string;
  key: string;
  value: string | null;
}

export interface AuditLog {
  id: string;
  clinic_id: string;
  user_id: string | null;
  table_name: string;
  record_id: string;
  action: AuditAction;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

// Dashboard aggregates
export interface DashboardStats {
  monthlyRevenue: number;
  revenueChange: number;
  totalPatients: number;
  newPatientsThisMonth: number;
  totalDebts: number;
  debtPatientCount: number;
  pendingLabOrders: number;
  todayReceivingCount: number;
}
