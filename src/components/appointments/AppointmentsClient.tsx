'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { createAppointment, updateAppointmentStatus, deleteAppointment, completeAppointmentFlow } from '@/lib/actions/appointments';
import { APPOINTMENT_TYPES, PAYMENT_METHODS } from '@/lib/validations/schemas';
import type { Patient } from '@/types';

interface AppointmentRow {
  id: string;
  patient_id: string;
  date: string;
  time: string;
  type: string;
  chair_number: number;
  status: string;
  notes: string | null;
  patient: { id: string; full_name: string; phone: string | null; code: string | null } | null;
}

interface AppointmentsClientProps {
  initialAppointments: AppointmentRow[];
  patients: Patient[];
}

const statusMap: Record<string, { cls: string; label: string }> = {
  attended: { cls: 'badge-green', label: 'حضر ✓' },
  upcoming: { cls: 'badge-teal', label: 'قادم' },
  postponed: { cls: 'badge-gold', label: 'مؤجل' },
  cancelled: { cls: 'badge-red', label: 'ملغي' },
  no_show: { cls: 'badge-red', label: 'لم يحضر' },
};

export default function AppointmentsClient({ initialAppointments, patients }: AppointmentsClientProps) {
  const [appointments, setAppointments] = useState<AppointmentRow[]>(initialAppointments);
  const [showModal, setShowModal] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [completeModal, setCompleteModal] = useState<AppointmentRow | null>(null);
  const [completeForm, setCompleteForm] = useState({
    type: '',
    cost: '',
    paid: '',
    method: 'cash',
    notes: ''
  });

  const [form, setForm] = useState({
    patient_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    type: 'كشف أولي',
    chair_number: 1,
    notes: '',
  });

  const filtered = appointments.filter(a => {
    if (filterDate && a.date !== filterDate) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'م' : 'ص';
    const display = hour > 12 ? hour - 12 : hour || 12;
    return `${display}:${m} ${ampm}`;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await createAppointment({
      patient_id: form.patient_id,
      date: form.date,
      time: form.time,
      type: form.type,
      chair_number: form.chair_number,
      status: 'upcoming',
      notes: form.notes || null,
    });

    if (!result.success) {
      setError(result.error || 'حدث خطأ');
      setLoading(false);
      return;
    }

    const newAppt = result.data?.appointment as AppointmentRow;
    setAppointments(prev => [...prev, newAppt]);
    setShowModal(false);
    setLoading(false);
    // Reset form
    setForm(f => ({ ...f, patient_id: '', notes: '' }));
  };

  const handleStatusChange = async (id: string, status: 'upcoming' | 'attended' | 'postponed' | 'cancelled' | 'no_show') => {
    const result = await updateAppointmentStatus(id, status);
    if (result.success) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModal) return;
    setError(''); setLoading(true);

    const result = await completeAppointmentFlow({
      appointment_id: completeModal.id,
      patient_id: completeModal.patient_id,
      type: completeForm.type || completeModal.type,
      cost: Number(completeForm.cost),
      paid_amount: Number(completeForm.paid),
      payment_method: completeForm.method,
      notes: completeForm.notes || undefined,
    });

    if (!result.success) { setError(result.error || 'خطأ'); setLoading(false); return; }
    
    setAppointments(prev => prev.map(a => a.id === completeModal.id ? { ...a, status: 'attended' } : a));
    setCompleteModal(null);
    setCompleteForm({ type: '', cost: '', paid: '', method: 'cash', notes: '' });
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteAppointment(id);
    if (result.success) {
      setAppointments(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <>
      <div className="sec-header">
        <div>
          <div className="sec-title">المواعيد <span>📅</span></div>
          <div className="sec-sub">{filtered.length} موعد</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ موعد جديد</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="date"
          className="form-input"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{ width: 'auto' }}
        />
        <div className="tabs" style={{ marginBottom: 0, width: 'auto' }}>
          {['all', 'upcoming', 'attended', 'postponed', 'cancelled'].map(s => (
            <button
              key={s}
              className={`tab ${filterStatus === s ? 'active' : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s === 'all' ? 'الكل' : statusMap[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div className="card">
        <div className="card-body">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
              لا توجد مواعيد في هذا اليوم
            </div>
          ) : (
            filtered.map(appt => {
              const badge = statusMap[appt.status] || statusMap.upcoming;
              return (
                <div className="appt-item" key={appt.id} style={{ cursor: 'default' }}>
                  <div className="appt-time">
                    <div className="hour">{formatTime(appt.time).split(' ')[0]}</div>
                    <div className="ampm">{formatTime(appt.time).split(' ')[1]}</div>
                  </div>
                  <div className="appt-info">
                    <div className="appt-name">
                      <a href={`/patients/${appt.patient_id}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                        {appt.patient?.full_name || 'مريض'}
                      </a>
                    </div>
                    <div className="appt-type">
                      {appt.type} • كرسي {appt.chair_number}
                      {appt.patient?.phone && ` • ${appt.patient.phone}`}
                    </div>
                  </div>
                  <span className={`badge ${badge.cls}`}>{badge.label}</span>

                  {/* Status Actions */}
                  <div style={{ display: 'flex', gap: 4, marginRight: 8 }}>
                    {appt.status === 'upcoming' && (
                      <>
                        <button className="btn btn-sm" style={{ background: 'rgba(0,214,143,0.15)', color: 'var(--green)', border: 'none', fontSize: 11 }}
                          onClick={() => { setCompleteModal(appt); setCompleteForm(f => ({ ...f, type: appt.type })); }}>حضر ✓</button>
                        <button className="btn btn-sm" style={{ background: 'rgba(240,180,41,0.15)', color: 'var(--gold)', border: 'none', fontSize: 11 }}
                          onClick={() => handleStatusChange(appt.id, 'postponed')}>تأجيل</button>
                      </>
                    )}
                    <button className="btn btn-sm btn-red" style={{ fontSize: 11 }}
                      onClick={() => handleDelete(appt.id)}>🗑️</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Appointment Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="موعد جديد">
        <form onSubmit={handleCreate}>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

          <div className="form-grid">
            <div className="form-group full">
              <label className="form-label">المريض *</label>
              <select
                className="form-input"
                value={form.patient_id}
                onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}
                required
              >
                <option value="">اختر المريض...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} ({p.code})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">التاريخ *</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">الوقت *</label>
              <input
                type="time"
                className="form-input"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">نوع الموعد *</label>
              <select
                className="form-input"
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              >
                {APPOINTMENT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">رقم الكرسي</label>
              <input
                type="number"
                className="form-input"
                value={form.chair_number}
                onChange={e => setForm(f => ({ ...f, chair_number: Number(e.target.value) }))}
                min={1}
                max={10}
              />
            </div>
            <div className="form-group full">
              <label className="form-label">ملاحظات</label>
              <input
                className="form-input"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start', marginTop: 20 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : '➕ حجز الموعد'}
            </button>
            <button className="btn btn-outline" type="button" onClick={() => setShowModal(false)}>
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Appointment Modal */}
      <Modal isOpen={!!completeModal} onClose={() => setCompleteModal(null)} title="إنهاء الموعد وتسجيل التكلفة">
        <form onSubmit={handleComplete}>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          <div className="form-grid">
            <div className="form-group full">
              <label className="form-label">نوع الإجراء (العلاج) *</label>
              <input className="form-input" value={completeForm.type} onChange={e => setCompleteForm(f => ({ ...f, type: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">إجمالي التكلفة (ج.م) *</label>
              <input type="number" className="form-input" value={completeForm.cost} onChange={e => setCompleteForm(f => ({ ...f, cost: e.target.value }))} required min={0} />
            </div>
            <div className="form-group">
              <label className="form-label">المدفوع الآن (ج.م) *</label>
              <input type="number" className="form-input" value={completeForm.paid} onChange={e => setCompleteForm(f => ({ ...f, paid: e.target.value }))} required min={0} />
            </div>
            <div className="form-group">
              <label className="form-label">طريقة الدفع</label>
              <select className="form-input" value={completeForm.method} onChange={e => setCompleteForm(f => ({ ...f, method: e.target.value }))}>
                {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label className="form-label">ملاحظات (طبي أو مالي)</label>
              <input className="form-input" value={completeForm.notes} onChange={e => setCompleteForm(f => ({ ...f, notes: e.target.value }))} placeholder="تفاصيل الإجراء..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'جاري...' : '✅ إنهاء الموعد'}</button>
            <button className="btn btn-outline" type="button" onClick={() => setCompleteModal(null)}>إلغاء</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
