import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import DentalChart from '@/components/dental-chart/DentalChart';
import PrescriptionsTab from '@/components/patients/PrescriptionsTab';
import TreatmentPlansTab from '@/components/patients/TreatmentPlansTab';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch patient
  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !patient) return notFound();

  // Fetch dental records
  const { data: dentalRecords } = await supabase
    .from('dental_records')
    .select('*')
    .eq('patient_id', id);

  // Fetch patient's appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('patient_id', id)
    .order('date', { ascending: false })
    .limit(10);

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('patient_id', id)
    .order('date', { ascending: false })
    .limit(10);

  const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  // Fetch patient's debts
  const { data: debts } = await supabase
    .from('debts')
    .select('*')
    .eq('patient_id', id)
    .order('created_at', { ascending: false });

  const totalDebts = debts?.filter(d => d.status !== 'paid').reduce((sum, d) => sum + Number(d.remaining_amount), 0) || 0;

  // Fetch prescriptions
  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('*, prescription_items(*)')
    .eq('patient_id', id)
    .order('created_at', { ascending: false });

  // Fetch treatment plans
  const { data: treatmentPlans } = await supabase
    .from('treatment_plans')
    .select('*')
    .eq('patient_id', id)
    .order('created_at', { ascending: false });

  // Fetch clinic for printing
  const { data: clinic } = await supabase
    .from('clinics')
    .select('name, doctor_name')
    .eq('id', patient.clinic_id)
    .single();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from('users').select('role').eq('id', user.id).single() : { data: null };
  const userRole = profile?.role || 'assistant';

  return (
    <>
      <div className="sec-header">
        <div>
          <div className="sec-title">
            <span className="badge badge-teal" style={{ fontSize: 14, marginLeft: 8 }}>{patient.code}</span>
            {patient.full_name}
          </div>
          <div className="sec-sub">
            {patient.phone && (
              <span style={{ marginLeft: 16 }}>
                📱 {patient.phone}
                <a href={`https://wa.me/2${patient.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', marginRight: 8, fontSize: 18 }} title="واتساب">
                  💬
                </a>
              </span>
            )}
            {patient.age && <span style={{ marginLeft: 16 }}>🎂 {patient.age} سنة</span>}
            {patient.gender && <span style={{ marginLeft: 16 }}>{patient.gender === 'male' ? '♂️ ذكر' : '♀️ أنثى'}</span>}
          </div>
        </div>
        <a href="/patients" className="btn btn-outline">← رجوع للمرضى</a>
      </div>

      {/* Medical Alerts */}
      {(patient.has_blood_pressure || patient.has_diabetes || patient.has_anesthesia_allergy) && (
        <div className="alert-banner alert-warn" style={{ marginBottom: 20 }}>
          ⚠️ تنبيهات طبية:
          {patient.has_blood_pressure && <span className="badge badge-red" style={{ marginRight: 8 }}>ضغط دم</span>}
          {patient.has_diabetes && <span className="badge badge-gold" style={{ marginRight: 8 }}>سكر</span>}
          {patient.has_anesthesia_allergy && <span className="badge badge-purple" style={{ marginRight: 8 }}>حساسية بنج</span>}
        </div>
      )}

      <div className="grid-main" style={{ marginBottom: 20 }}>
        {/* Dental Chart */}
        <DentalChart patientId={id} initialRecords={dentalRecords || []} />

        {/* Patient Summary */}
        <div>
          {/* Financial Summary */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span className="card-title">💰 ملخص مالي</span>
            </div>
            <div className="card-body">
              <div className="summary-row" style={{ flexDirection: 'column', gap: 12 }}>
                <div className="summary-item">
                  <span className="summary-val" style={{ color: 'var(--green)' }}>{totalPaid.toLocaleString()}</span>
                  <span className="summary-lbl">إجمالي المدفوع (ج.م)</span>
                </div>
                <div className="summary-item">
                  <span className="summary-val" style={{ color: totalDebts > 0 ? 'var(--red)' : 'var(--green)' }}>{totalDebts.toLocaleString()}</span>
                  <span className="summary-lbl">ديون معلقة (ج.م)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Notes */}
          {patient.medical_notes && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <span className="card-title">📋 ملاحظات طبية</span>
              </div>
              <div className="card-body">
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>{patient.medical_notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prescriptions */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <PrescriptionsTab 
            patientId={id} 
            prescriptions={prescriptions || []} 
            clinicName={clinic?.name} 
            doctorName={clinic?.doctor_name} 
          />
        </div>
      </div>

      {/* Treatment Plans */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body">
          <TreatmentPlansTab 
            patientId={id} 
            plans={treatmentPlans || []} 
            userRole={userRole}
          />
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title">📅 آخر المواعيد</span>
        </div>
        <div className="card-body">
          {!appointments || appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا توجد مواعيد</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الوقت</th>
                    <th>النوع</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(a => {
                    const statusLabels: Record<string, { cls: string; label: string }> = {
                      attended: { cls: 'badge-green', label: 'حضر' },
                      upcoming: { cls: 'badge-teal', label: 'قادم' },
                      postponed: { cls: 'badge-gold', label: 'مؤجل' },
                      cancelled: { cls: 'badge-red', label: 'ملغي' },
                      no_show: { cls: 'badge-red', label: 'لم يحضر' },
                    };
                    const badge = statusLabels[a.status] || statusLabels.upcoming;
                    return (
                      <tr key={a.id}>
                        <td>{a.date}</td>
                        <td style={{ direction: 'ltr', textAlign: 'right' }}>{a.time?.slice(0, 5)}</td>
                        <td>{a.type}</td>
                        <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Payments */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">💳 آخر المدفوعات</span>
        </div>
        <div className="card-body">
          {!payments || payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا توجد مدفوعات</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>الطريقة</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td>{p.date}</td>
                      <td style={{ fontWeight: 800 }}>{Number(p.amount).toLocaleString()} ج.م</td>
                      <td>
                        <span className="badge badge-teal">
                          {p.method === 'cash' ? 'كاش' : p.method === 'card' ? 'فيزا' : p.method === 'vodafone' ? 'فودافون' : 'تحويل'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Debts */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">💳 سجل الديون</span>
        </div>
        <div className="card-body">
          {!debts || debts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>لا توجد ديون مسجلة</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الإجمالي</th>
                    <th>المتبقي</th>
                    <th>ملاحظات</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map(d => {
                    const statusLabels: Record<string, { cls: string; label: string }> = {
                      pending: { cls: 'badge-red', label: 'غير مسدد' },
                      partial: { cls: 'badge-gold', label: 'تسديد جزئي' },
                      paid: { cls: 'badge-green', label: 'مسدد بالكامل' },
                    };
                    const badge = statusLabels[d.status] || statusLabels.pending;
                    return (
                      <tr key={d.id}>
                        <td>{new Date(d.created_at).toLocaleDateString('ar-EG')}</td>
                        <td>{Number(d.total_amount).toLocaleString()} ج.م</td>
                        <td style={{ fontWeight: 800, color: d.remaining_amount > 0 ? 'var(--red)' : 'inherit' }}>{Number(d.remaining_amount).toLocaleString()} ج.م</td>
                        <td>{d.notes || '—'}</td>
                        <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
