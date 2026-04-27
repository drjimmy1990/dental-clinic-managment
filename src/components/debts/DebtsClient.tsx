'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { createDebt, updateDebtPayment, deleteDebt } from '@/lib/actions/debts';
import type { Patient } from '@/types';

interface DebtRow {
  id: string;
  direction: string;
  total_amount: number;
  remaining_amount: number;
  due_date: string | null;
  status: string;
  notes: string | null;
  patient: { id: string; full_name: string; code: string | null } | null;
  supplier: { id: string; name: string } | null;
}

export default function DebtsClient({ initialDebts, patients }: { initialDebts: DebtRow[]; patients: Patient[] }) {
  const [debts, setDebts] = useState(initialDebts);
  const [showModal, setShowModal] = useState(false);
  const [payModal, setPayModal] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ patient_id: '', total_amount: '', due_date: '', notes: '' });

  const totalDebts = debts.filter(d => d.status !== 'paid').reduce((s, d) => s + Number(d.remaining_amount), 0);
  const statusMap: Record<string, { cls: string; label: string }> = {
    pending: { cls: 'badge-red', label: 'معلق' },
    partial: { cls: 'badge-gold', label: 'جزئي' },
    paid: { cls: 'badge-green', label: 'مسدد' },
    overdue: { cls: 'badge-red', label: 'متأخر' },
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const amt = Number(form.total_amount);
    const result = await createDebt({
      direction: 'patient_owes',
      patient_id: form.patient_id,
      total_amount: amt,
      remaining_amount: amt,
      due_date: form.due_date || undefined,
      notes: form.notes || undefined,
    });
    if (!result.success) { setError(result.error || 'خطأ'); setLoading(false); return; }
    setDebts(prev => [result.data?.debt as DebtRow, ...prev]);
    setShowModal(false);
    setLoading(false);
    setForm({ patient_id: '', total_amount: '', due_date: '', notes: '' });
  };

  const handlePay = async () => {
    if (!payModal || !payAmount) return;
    const result = await updateDebtPayment(payModal, Number(payAmount));
    if (result.success) {
      setDebts(prev => prev.map(d => {
        if (d.id !== payModal) return d;
        const newRemaining = Math.max(0, Number(d.remaining_amount) - Number(payAmount));
        return { ...d, remaining_amount: newRemaining, status: newRemaining === 0 ? 'paid' : 'partial' };
      }));
      setPayModal(null);
      setPayAmount('');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteDebt(id);
    if (result.success) setDebts(prev => prev.filter(d => d.id !== id));
  };

  return (
    <>
      <div className="sec-header">
        <div>
          <div className="sec-title">الديون <span>💳</span></div>
          <div className="sec-sub">إجمالي المعلق: <span style={{ color: 'var(--red)', fontWeight: 800 }}>{totalDebts.toLocaleString()} ج.م</span></div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ دين جديد</button>
      </div>

      <div className="card">
        <div className="card-body">
          {debts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>لا توجد ديون 🎉</div>
          ) : (
            debts.map(d => {
              const badge = statusMap[d.status] || statusMap.pending;
              const pct = d.total_amount > 0 ? ((Number(d.total_amount) - Number(d.remaining_amount)) / Number(d.total_amount)) * 100 : 0;
              return (
                <div className="debt-card" key={d.id}>
                  <div className="debt-info">
                    <div className="debt-name">{d.patient?.full_name || d.supplier?.name || '—'}</div>
                    <div className="debt-detail">
                      إجمالي: {Number(d.total_amount).toLocaleString()} ج.م
                      {d.due_date && ` • استحقاق: ${d.due_date}`}
                    </div>
                    <div className="progress-wrap" style={{ marginTop: 8 }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--green)' }} />
                    </div>
                  </div>
                  <div className="debt-amount">
                    <div className="debt-total">{Number(d.remaining_amount).toLocaleString()}</div>
                    <span className={`badge ${badge.cls}`} style={{ marginTop: 4 }}>{badge.label}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {d.status !== 'paid' && (
                      <button className="btn btn-sm btn-primary" onClick={() => setPayModal(d.id)} style={{ fontSize: 11 }}>💵 سداد</button>
                    )}
                    <button className="btn btn-sm btn-red" onClick={() => handleDelete(d.id)} style={{ fontSize: 11 }}>🗑️</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Debt Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="دين جديد">
        <form onSubmit={handleCreate}>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          <div className="form-grid">
            <div className="form-group full">
              <label className="form-label">المريض *</label>
              <select className="form-input" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} required>
                <option value="">اختر...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">المبلغ (ج.م) *</label>
              <input type="number" className="form-input" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} min={1} required />
            </div>
            <div className="form-group">
              <label className="form-label">تاريخ الاستحقاق</label>
              <input type="date" className="form-input" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
            <div className="form-group full">
              <label className="form-label">ملاحظات</label>
              <input className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="تفاصيل الدين..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'جاري...' : '➕ إضافة'}</button>
            <button className="btn btn-outline" type="button" onClick={() => setShowModal(false)}>إلغاء</button>
          </div>
        </form>
      </Modal>

      {/* Pay Debt Modal */}
      <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title="💵 سداد دين">
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">مبلغ السداد (ج.م)</label>
          <input type="number" className="form-input" value={payAmount} onChange={e => setPayAmount(e.target.value)} min={1} placeholder="0" autoFocus />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={handlePay}>💵 سداد</button>
          <button className="btn btn-outline" onClick={() => setPayModal(null)}>إلغاء</button>
        </div>
      </Modal>
    </>
  );
}
