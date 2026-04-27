'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { createPayment, deletePayment } from '@/lib/actions/payments';
import { PAYMENT_METHODS } from '@/lib/validations/schemas';
import type { Patient } from '@/types';

interface PaymentRow {
  id: string;
  patient_id: string;
  amount: number;
  method: string;
  date: string;
  notes: string | null;
  patient: { id: string; full_name: string; code: string | null } | null;
}

export default function PaymentsClient({ initialPayments, patients }: { initialPayments: PaymentRow[]; patients: Patient[] }) {
  const [payments, setPayments] = useState(initialPayments);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    patient_id: '',
    amount: '',
    method: 'cash' as keyof typeof PAYMENT_METHODS,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [printReceipt, setPrintReceipt] = useState<PaymentRow | null>(null);

  useEffect(() => {
    if (printReceipt) {
      window.print();
      // We don't set to null immediately so the DOM has time to render it for printing,
      // but in a real app, you might use onafterprint event.
      const timer = setTimeout(() => setPrintReceipt(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [printReceipt]);

  const total = payments.reduce((s, p) => s + Number(p.amount), 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await createPayment({
      patient_id: form.patient_id,
      amount: Number(form.amount),
      method: form.method,
      date: form.date,
      notes: form.notes || null,
    });

    if (!result.success) { setError(result.error || 'خطأ'); setLoading(false); return; }
    setPayments(prev => [result.data?.payment as PaymentRow, ...prev]);
    setShowModal(false);
    setLoading(false);
    setForm(f => ({ ...f, patient_id: '', amount: '', notes: '' }));
  };

  const handleDelete = async (id: string) => {
    const result = await deletePayment(id);
    if (result.success) setPayments(prev => prev.filter(p => p.id !== id));
  };

  return (
    <>
      <div className="sec-header">
        <div>
          <div className="sec-title">المدفوعات <span>💰</span></div>
          <div className="sec-sub">إجمالي: {total.toLocaleString()} ج.م — {payments.length} عملية</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ دفعة جديدة</button>
      </div>

      <div className="card">
        <div className="card-body">
          {payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>لا توجد مدفوعات بعد</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>التاريخ</th><th>المريض</th><th>المبلغ</th><th>الطريقة</th><th>ملاحظات</th><th></th></tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td>{p.date}</td>
                      <td style={{ fontWeight: 700 }}>{p.patient?.full_name || '—'}</td>
                      <td style={{ fontWeight: 800 }}>{Number(p.amount).toLocaleString()} ج.م</td>
                      <td><span className="badge badge-teal">{PAYMENT_METHODS[p.method as keyof typeof PAYMENT_METHODS] || p.method}</span></td>
                      <td style={{ color: 'var(--muted)', fontSize: 12 }}>{p.notes || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm btn-outline" onClick={() => setPrintReceipt(p)} title="طباعة إيصال">🖨️</button>
                          <button className="btn btn-sm btn-red" onClick={() => handleDelete(p.id)} title="حذف">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="دفعة جديدة">
        <form onSubmit={handleCreate}>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          <div className="form-grid">
            <div className="form-group full">
              <label className="form-label">المريض *</label>
              <select className="form-input" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} required>
                <option value="">اختر المريض...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.code})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">المبلغ (ج.م) *</label>
              <input type="number" className="form-input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} min={1} required placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">طريقة الدفع</label>
              <select className="form-input" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value as keyof typeof PAYMENT_METHODS }))}>
                {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">التاريخ</label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">ملاحظات</label>
              <input className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="وصف الدفعة..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'جاري...' : '💰 تسجيل الدفعة'}</button>
            <button className="btn btn-outline" type="button" onClick={() => setShowModal(false)}>إلغاء</button>
          </div>
        </form>
      </Modal>

      {/* Hidden Receipt Layout */}
      {printReceipt && (
        <div className="print-receipt">
          <div style={{ textAlign: 'center', borderBottom: '2px dashed #ccc', paddingBottom: 20, marginBottom: 20 }}>
            <h1 style={{ margin: '0 0 10px', color: '#333' }}>DentaCare Pro</h1>
            <p style={{ margin: 0, color: '#666' }}>إيصال استلام نقدية</p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <strong>رقم الإيصال:</strong> <span>{printReceipt.id.substring(0, 8)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <strong>التاريخ:</strong> <span>{printReceipt.date}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <strong>المريض:</strong> <span>{printReceipt.patient?.full_name || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <strong>طريقة الدفع:</strong> <span>{PAYMENT_METHODS[printReceipt.method as keyof typeof PAYMENT_METHODS] || printReceipt.method}</span>
          </div>
          
          <div style={{ background: '#f5f5f5', padding: 15, borderRadius: 8, margin: '20px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>المبلغ المدفوع</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{Number(printReceipt.amount).toLocaleString()} ج.م</div>
          </div>
          
          {printReceipt.notes && (
            <div style={{ marginBottom: 20 }}>
              <strong>البيان:</strong> <span style={{ color: '#666' }}>{printReceipt.notes}</span>
            </div>
          )}
          
          <div style={{ textAlign: 'center', marginTop: 40, color: '#999', fontSize: 12 }}>
            <p>نشكركم على ثقتكم بنا</p>
            <p>تم الإصدار بواسطة نظام DentaCare Pro</p>
          </div>
        </div>
      )}
    </>
  );
}
