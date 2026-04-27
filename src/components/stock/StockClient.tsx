'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { createInventoryItem, updateInventoryQuantity, deleteInventoryItem } from '@/lib/actions/inventory';
import type { InventoryItem } from '@/types';

const CATEGORIES = ['مستهلكات', 'أدوات', 'مواد حشو', 'مواد تعقيم', 'قفازات وكمامات', 'أخرى'];

export default function StockClient({ initialItems }: { initialItems: InventoryItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [showModal, setShowModal] = useState(false);
  const [adjustModal, setAdjustModal] = useState<{ id: string; type: 'in' | 'out' } | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'مستهلكات', quantity: '', unit: '', min_threshold: '5', cost_per_unit: '' });

  const lowStock = items.filter(i => i.quantity <= i.min_threshold);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    const r = await createInventoryItem({ name: form.name, category: form.category, quantity: Number(form.quantity), unit: form.unit || undefined, min_threshold: Number(form.min_threshold) || 5, cost_per_unit: form.cost_per_unit ? Number(form.cost_per_unit) : 0 });
    if (!r.success) { setError(r.error || 'خطأ'); setLoading(false); return; }
    setItems(prev => [r.data?.item as InventoryItem, ...prev]);
    setShowModal(false); setLoading(false);
    setForm({ name: '', category: 'مستهلكات', quantity: '', unit: '', min_threshold: '5', cost_per_unit: '' });
  };

  const handleAdjust = async () => {
    if (!adjustModal || !adjustQty) return;
    const r = await updateInventoryQuantity(adjustModal.id, adjustModal.type, Number(adjustQty));
    if (r.success) {
      setItems(prev => prev.map(i => {
        if (i.id !== adjustModal.id) return i;
        const newQty = adjustModal.type === 'in' ? i.quantity + Number(adjustQty) : Math.max(0, i.quantity - Number(adjustQty));
        return { ...i, quantity: newQty };
      }));
      setAdjustModal(null); setAdjustQty('');
    }
  };

  return (
    <>
      <div className="sec-header">
        <div><div className="sec-title">المخزن <span>📦</span></div>
          <div className="sec-sub">{items.length} صنف{lowStock.length > 0 && <span style={{ color: 'var(--red)', marginRight: 8 }}>• {lowStock.length} تحت الحد الأدنى</span>}</div></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ صنف جديد</button>
      </div>

      {lowStock.length > 0 && <div className="alert-banner alert-danger" style={{ marginBottom: 16 }}>⚠️ أصناف تحت الحد الأدنى: {lowStock.map(i => i.name).join('، ')}</div>}

      <div className="card"><div className="card-body">
        {items.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>لا توجد أصناف</div> :
          items.map(item => (
            <div className="stock-item" key={item.id}>
              <div className="stock-icon">📦</div>
              <div className="stock-info">
                <div className="stock-name">{item.name}</div>
                <div className="stock-cat">{item.category} {item.cost_per_unit > 0 && `• ${item.cost_per_unit} ج.م/وحدة`}</div>
              </div>
              <div className="stock-qty">
                <div className="stock-num" style={{ color: item.quantity <= item.min_threshold ? 'var(--red)' : 'var(--green)' }}>{item.quantity}</div>
                <div className="stock-unit">{item.unit || 'وحدة'}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-sm" style={{ background: 'rgba(0,214,143,0.15)', color: 'var(--green)', border: 'none' }} onClick={() => setAdjustModal({ id: item.id, type: 'in' })}>➕</button>
                <button className="btn btn-sm btn-gold" onClick={() => setAdjustModal({ id: item.id, type: 'out' })}>➖</button>
                <button className="btn btn-sm btn-red" onClick={() => deleteInventoryItem(item.id).then(r => { if (r.success) setItems(prev => prev.filter(i => i.id !== item.id)); })}>🗑️</button>
              </div>
            </div>
          ))}
      </div></div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="صنف جديد">
        <form onSubmit={handleCreate}>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          <div className="form-grid">
            <div className="form-group"><label className="form-label">الاسم *</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">الفئة</label><select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="form-group"><label className="form-label">الكمية *</label><input type="number" className="form-input" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required min={0} /></div>
            <div className="form-group"><label className="form-label">الوحدة</label><input className="form-input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="علبة، قطعة..." /></div>
            <div className="form-group"><label className="form-label">الحد الأدنى</label><input type="number" className="form-input" value={form.min_threshold} onChange={e => setForm(f => ({ ...f, min_threshold: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">سعر الوحدة</label><input type="number" className="form-input" value={form.cost_per_unit} onChange={e => setForm(f => ({ ...f, cost_per_unit: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'جاري...' : '➕ إضافة'}</button><button className="btn btn-outline" type="button" onClick={() => setShowModal(false)}>إلغاء</button></div>
        </form>
      </Modal>

      <Modal isOpen={!!adjustModal} onClose={() => setAdjustModal(null)} title={adjustModal?.type === 'in' ? '➕ إضافة للمخزن' : '➖ صرف من المخزن'}>
        <div className="form-group" style={{ marginBottom: 20 }}><label className="form-label">الكمية</label><input type="number" className="form-input" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} min={1} autoFocus /></div>
        <div style={{ display: 'flex', gap: 10 }}><button className="btn btn-primary" onClick={handleAdjust}>{adjustModal?.type === 'in' ? '➕ إضافة' : '➖ صرف'}</button><button className="btn btn-outline" onClick={() => setAdjustModal(null)}>إلغاء</button></div>
      </Modal>
    </>
  );
}
