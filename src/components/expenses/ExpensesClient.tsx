'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { createExpense, deleteExpense } from '@/lib/actions/hr';
import type { Expense } from '@/types';

const EXPENSE_CATS = ['إيجار', 'كهرباء ومياه', 'إنترنت', 'مستهلكات', 'صيانة', 'تسويق', 'نظافة', 'أخرى'];

export default function ExpensesClient({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ category: 'إيجار', type: 'fixed' as 'fixed' | 'variable', amount: '', month: new Date().toISOString().substring(0, 7) + '-01', notes: '' });

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const fixed = expenses.filter(e => e.type === 'fixed').reduce((s, e) => s + Number(e.amount), 0);
  const variable = expenses.filter(e => e.type === 'variable').reduce((s, e) => s + Number(e.amount), 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    const r = await createExpense({ category: form.category, type: form.type, amount: Number(form.amount), month: form.month, notes: form.notes || undefined });
    if (!r.success) { setError(r.error || 'خطأ'); setLoading(false); return; }
    setExpenses(prev => [r.data?.expense as Expense, ...prev]);
    setShowModal(false); setLoading(false);
    setForm(f => ({ ...f, amount: '', notes: '' }));
  };

  return (
    <>
      <div className="sec-header">
        <div><div className="sec-title">المصاريف <span>💸</span></div>
          <div className="sec-sub">إجمالي: {total.toLocaleString()} ج.م</div></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ مصروف جديد</button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="stat-card"><span className="stat-icon">💸</span><span className="stat-num">{total.toLocaleString()}</span><div className="stat-label">إجمالي المصاريف</div></div>
        <div className="stat-card"><span className="stat-icon">📌</span><span className="stat-num">{fixed.toLocaleString()}</span><div className="stat-label">مصاريف ثابتة</div></div>
        <div className="stat-card"><span className="stat-icon">🔄</span><span className="stat-num">{variable.toLocaleString()}</span><div className="stat-label">مصاريف متغيرة</div></div>
      </div>

      <div className="card"><div className="card-body">
        {expenses.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>لا توجد مصاريف</div> :
          expenses.map(exp => (
            <div className="expense-row" key={exp.id}>
              <div className="expense-icon">{exp.type === 'fixed' ? '📌' : '🔄'}</div>
              <div style={{ flex: 1 }}>
                <div className="expense-name">{exp.category}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{exp.month?.substring(0, 7)} • {exp.type === 'fixed' ? 'ثابت' : 'متغير'}{exp.notes && ` • ${exp.notes}`}</div>
              </div>
              <div className="expense-amt">{Number(exp.amount).toLocaleString()} ج.م</div>
              <button className="btn btn-sm btn-red" onClick={() => deleteExpense(exp.id).then(r => { if (r.success) setExpenses(prev => prev.filter(e => e.id !== exp.id)); })}>🗑️</button>
            </div>
          ))}
      </div></div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="مصروف جديد">
        <form onSubmit={handleCreate}>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          <div className="form-grid">
            <div className="form-group"><label className="form-label">الفئة</label><select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="form-group"><label className="form-label">النوع</label><select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'fixed' | 'variable' }))}><option value="fixed">ثابت</option><option value="variable">متغير</option></select></div>
            <div className="form-group"><label className="form-label">المبلغ *</label><input type="number" className="form-input" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required min={1} /></div>
            <div className="form-group"><label className="form-label">الشهر</label><input type="date" className="form-input" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} /></div>
            <div className="form-group full"><label className="form-label">ملاحظات</label><input className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'جاري...' : '➕ إضافة'}</button><button className="btn btn-outline" type="button" onClick={() => setShowModal(false)}>إلغاء</button></div>
        </form>
      </Modal>
    </>
  );
}
