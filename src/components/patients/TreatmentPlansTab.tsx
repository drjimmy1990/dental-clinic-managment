'use client';

import { useState } from 'react';
import Modal from '../ui/Modal';
import { createTreatmentPlan, payForTreatmentPlan } from '@/lib/actions/plans';

export default function TreatmentPlansTab({ patientId, plans }: { patientId: string; plans: any[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [activePayPlan, setActivePayPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ name: '', total_cost: '' });
  const [payForm, setPayForm] = useState({ amount: '', method: 'cash' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await createTreatmentPlan({
        patient_id: patientId,
        name: form.name,
        total_cost: Number(form.total_cost)
      });
      setIsAdding(false);
      setForm({ name: '', total_cost: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await payForTreatmentPlan({
        plan_id: activePayPlan.id,
        patient_id: patientId,
        amount: Number(payForm.amount),
        method: payForm.method
      });
      setActivePayPlan(null);
      setPayForm({ amount: '', method: 'cash' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>خطط العلاج الشاملة (التقويم / الزراعة)</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}>+ خطة جديدة</button>
      </div>

      {!plans || plans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', background: '#fff', borderRadius: 8 }}>لا توجد خطط علاجية</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {plans.map((p) => {
            const progress = (Number(p.total_paid) / Number(p.total_cost)) * 100;
            return (
              <div key={p.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <strong style={{ fontSize: 16 }}>{p.name || 'خطة علاج'}</strong>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                      {new Date(p.created_at).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                  <div>
                    {p.status === 'completed' ? (
                      <span className="badge badge-green">مكتمل</span>
                    ) : (
                      <span className="badge badge-teal">نشط</span>
                    )}
                  </div>
                </div>

                <div style={{ background: 'var(--bg)', padding: 16, borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13 }}>إجمالي التكلفة: <strong>{Number(p.total_cost).toLocaleString()} ج.م</strong></span>
                    <span style={{ fontSize: 13 }}>المدفوع: <strong style={{ color: 'var(--green)' }}>{Number(p.total_paid).toLocaleString()} ج.م</strong></span>
                    <span style={{ fontSize: 13 }}>المتبقي: <strong style={{ color: 'var(--red)' }}>{(Number(p.total_cost) - Number(p.total_paid)).toLocaleString()} ج.م</strong></span>
                  </div>
                  
                  {/* Progress bar */}
                  <div style={{ height: 8, background: 'rgba(0,0,0,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--teal), var(--cyan))' }} />
                  </div>

                  {p.status !== 'completed' && (
                    <button className="btn btn-outline btn-sm" onClick={() => setActivePayPlan(p)}>تسجيل دفعة 💳</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Plan Modal */}
      <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="إنشاء خطة علاج جديدة">
        <form onSubmit={handleCreate}>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          <div className="form-group full">
            <label className="form-label">اسم الخطة (مثال: تقويم فكين، زراعة 3 أسنان) *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group full">
            <label className="form-label">إجمالي التكلفة (ج.م) *</label>
            <input className="form-input" type="number" value={form.total_cost} onChange={e => setForm({ ...form, total_cost: e.target.value })} required min={1} />
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'جاري الحفظ...' : 'حفظ الخطة'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setIsAdding(false)}>إلغاء</button>
          </div>
        </form>
      </Modal>

      {/* Pay Modal */}
      <Modal isOpen={!!activePayPlan} onClose={() => setActivePayPlan(null)} title="تسجيل دفعة من خطة العلاج">
        <form onSubmit={handlePay}>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          
          <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 13, marginBottom: 4 }}>المبلغ المتبقي: <strong>{(Number(activePayPlan?.total_cost) - Number(activePayPlan?.total_paid)).toLocaleString()} ج.م</strong></div>
          </div>

          <div className="form-group full">
            <label className="form-label">المبلغ المدفوع (ج.م) *</label>
            <input className="form-input" type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required min={1} max={Number(activePayPlan?.total_cost) - Number(activePayPlan?.total_paid)} />
          </div>
          <div className="form-group full">
            <label className="form-label">طريقة الدفع *</label>
            <select className="form-input" value={payForm.method} onChange={e => setPayForm({ ...payForm, method: e.target.value })}>
              <option value="cash">كاش</option>
              <option value="card">فيزا</option>
              <option value="vodafone">فودافون كاش</option>
              <option value="transfer">تحويل بنكي</option>
            </select>
          </div>
          
          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'جاري التسجيل...' : 'تأكيد الدفع'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setActivePayPlan(null)}>إلغاء</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
