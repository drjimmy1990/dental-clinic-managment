import { z } from 'zod';

// ─── PATIENTS ───
export const patientSchema = z.object({
  full_name: z.string().min(2, 'الاسم مطلوب (حرفين على الأقل)'),
  phone: z.string().optional(),
  age: z.coerce.number().min(0).max(120).optional().nullable(),
  gender: z.enum(['male', 'female']).optional().nullable(),
  address: z.string().optional().nullable(),
  has_blood_pressure: z.boolean().default(false),
  has_diabetes: z.boolean().default(false),
  has_anesthesia_allergy: z.boolean().default(false),
  medical_notes: z.string().optional().nullable(),
});

export type PatientInput = z.infer<typeof patientSchema>;

// ─── APPOINTMENTS ───
export const appointmentSchema = z.object({
  patient_id: z.string().uuid('اختر مريض'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  time: z.string().min(1, 'الوقت مطلوب'),
  type: z.string().min(1, 'نوع الموعد مطلوب'),
  chair_number: z.coerce.number().min(1).max(10).default(1),
  status: z.enum(['upcoming', 'attended', 'postponed', 'cancelled', 'no_show']).default('upcoming'),
  notes: z.string().optional().nullable(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

// ─── DENTAL RECORDS ───
export const dentalRecordSchema = z.object({
  patient_id: z.string().uuid(),
  tooth_number: z.number().min(11).max(48),
  status: z.enum(['healthy', 'filled', 'crowned', 'extracted', 'root_canal', 'needs_work']),
  notes: z.string().optional().nullable(),
});

export type DentalRecordInput = z.infer<typeof dentalRecordSchema>;

// ─── PAYMENTS ───
export const paymentSchema = z.object({
  patient_id: z.string().uuid('اختر مريض'),
  procedure_id: z.string().uuid().optional().nullable(),
  treatment_plan_id: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive('المبلغ مطلوب'),
  method: z.enum(['cash', 'card', 'vodafone', 'transfer']).default('cash'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().optional().nullable(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

// ─── PROCEDURES ───
export const procedureSchema = z.object({
  patient_id: z.string().uuid(),
  appointment_id: z.string().uuid().optional().nullable(),
  type: z.string().min(1, 'نوع الإجراء مطلوب'),
  tooth_numbers: z.array(z.number()).optional().nullable(),
  cost: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

export type ProcedureInput = z.infer<typeof procedureSchema>;

// ─── CONSTANTS ───
export const APPOINTMENT_TYPES = [
  'كشف أولي',
  'حشو',
  'خلع',
  'تركيب تلبيسة',
  'علاج عصب',
  'تنظيف جير',
  'تقويم',
  'زراعة',
  'حشو جمالي',
  'جراحة لثة',
  'تبييض',
] as const;

export const PAYMENT_METHODS = {
  cash: 'كاش',
  card: 'فيزا',
  vodafone: 'فودافون كاش',
  transfer: 'تحويل بنكي',
} as const;

export const TOOTH_STATUSES = {
  healthy: { label: 'سليم', color: 'green' },
  filled: { label: 'حشو', color: 'teal' },
  crowned: { label: 'تلبيسة', color: 'gold' },
  extracted: { label: 'مخلوع', color: 'red' },
  root_canal: { label: 'عصب', color: 'purple' },
  needs_work: { label: 'يحتاج علاج', color: 'red' },
} as const;
