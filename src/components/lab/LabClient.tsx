'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { createLabOrder, updateLabOrderStatus, deleteLabOrder } from '@/lib/actions/lab';
import type { Patient } from '@/types';

interface LabOrderRow {
  id: string; patient_id: string; type: string; shade: string | null;
  sent_date: string | null; expected_date: string | null; cost: number;
  status: string; notes: string | null;
  patient: { id: string; full_name: string; code: string | null } | null;
}

const statusMap: Record<string, { cls: string; label: string }> = {
  at_lab: { cls: 'badge-blue', label: 'في المعمل' },
  ready: { cls: 'badge-green', label: 'جاهز' },
  received: { cls: 'badge-teal', label: 'تم الاستلام' },
  delayed: { cls: 'badge-red', label: 'متأخر' },
  cancelled: { cls: 'badge-red', label: 'ملغي' },
};
const LAB_TYPES = ['تلبيسة زيركون', 'تلبيسة PFM', 'جسر', 'طقم متحرك', 'فينير', 'نايت جارد', 'أخرى'];

export default function LabClient({ initialOrders, patients }: { initialOrders: LabOrderRow[]; patients: Patient[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ patient_id: '', type: 'تلبيسة زيركون', shade: '', cost: '', sent_date: new Date().toISOString().split('T')[0], expected_date: '', notes: '' });

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    const result = await createLabOrder({ patient_id: form.patient_id, type: form.type, shade: form.shade || undefined, cost: form.cost ? Number(form.cost) : 0, sent_date: form.sent_date || undefined, expected_date: form.expected_date || undefined, notes: form.notes || undefined });
    if (!result.success) { setError(result.error || 'خطأ'); setLoading(false); return; }
    setOrders(prev => [result.data?.order as LabOrderRow, ...prev]);
    setShowModal(false); setLoading(false);
  };

  const handleStatus = async (id: string, status: 'at_lab' | 'ready' | 'received' | 'delayed' | 'cancelled') => {
    const r = await updateLabOrderStatus(id, status);
    if (r.success) setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  return (
    <>
      <div className="sec-header">
        <div><div className="sec-title">معمل التركيبات <span>🧪</span></div>
          <div className="sec-sub">{orders.filter(o => o.status === 'at_lab').length} في المعمل • {orders.filter(o => o.status === 'ready').length} جاهز</div></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ شغلة جديدة</button>
      </div>
      <div className="tabs">
        {['all', 'at_lab', 'ready', 'received', 'delayed'].map(s => (
          <button key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s === 'all' ? 'الكل' : statusMap[s]?.label}</button>
        ))}
      </div>
      <div className="card"><div className="card-body">
        {filtered.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>لا توجد طلبات</div> :
          filtered.map(o => {
            const badge = statusMap[o.status] || statusMap.at_lab;
            return (<div className="lab-item" key={o.id}>
              <div className="lab-header-row">
                <div><div className="lab-name">{o.patient?.full_name} — {o.type}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{o.shade && `لون: ${o.shade} • `}{o.sent_date && `إرسال: ${o.sent_date} • `}{Number(o.cost) > 0 && `${Number(o.cost).toLocaleString()} ج.م`}</div></div>
                <span className={`badge ${badge.cls}`}>{badge.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {o.status === 'at_lab' && <button className="btn btn-sm" style={{ background: 'rgba(0,214,143,0.15)', color: 'var(--green)', border: 'none' }} onClick={() => handleStatus(o.id, 'ready')}>✅ جاهز</button>}
                {o.status === 'ready' && <button className="btn btn-sm btn-primary" onClick={() => handleStatus(o.id, 'received')}>📦 استلام</button>}
                <button className="btn btn-sm btn-red" onClick={() => deleteLabOrder(o.id).then(r => { if (r.success) setOrders(prev => prev.filter(x => x.id !== o.id)); })}>🗑️</button>
              </div>
            </div>);
          })}
      </div></div>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="شغلة معمل جديدة">
        <form onSubmit={handleCreate}>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          <div className="form-grid">
            <div className="form-group full"><label className="form-label">المريض *</label><select className="form-input" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))} required><option value="">اختر...</option>{patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">النوع</label><select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>{LAB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div className="form-group"><label className="form-label">اللون</label><input className="form-input" value={form.shade} onChange={e => setForm(f => ({ ...f, shade: e.target.value }))} placeholder="A2, B1..." /></div>
            <div className="form-group"><label className="form-label">تاريخ الإرسال</label><input type="date" className="form-input" value={form.sent_date} onChange={e => setForm(f => ({ ...f, sent_date: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">التكلفة</label><input type="number" className="form-input" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'جاري...' : '🧪 إرسال'}</button><button className="btn btn-outline" type="button" onClick={() => setShowModal(false)}>إلغاء</button></div>
        </form>
      </Modal>
    </>
  );
}
