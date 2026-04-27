'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { createEmployee, createSalaryRecord, paySalary } from '@/lib/actions/hr';
import type { Employee } from '@/types';

interface SalaryRow {
  id: string; employee_id: string; month: string; base_amount: number; bonuses: number; deductions: number; net_amount: number; status: string; paid_date: string | null;
  employee: { id: string; full_name: string; role: string } | null;
}

export default function SalariesClient({ initialEmployees, initialRecords }: { initialEmployees: Employee[]; initialRecords: SalaryRow[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [records, setRecords] = useState(initialRecords);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [showSalModal, setShowSalModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [empForm, setEmpForm] = useState({ full_name: '', role: 'مساعد', base_salary: '' });
  const [salForm, setSalForm] = useState({ employee_id: '', month: new Date().toISOString().substring(0, 7) + '-01', bonuses: '0', deductions: '0' });

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    const r = await createEmployee({ full_name: empForm.full_name, role: empForm.role, base_salary: Number(empForm.base_salary) });
    if (!r.success) { setError(r.error || 'خطأ'); setLoading(false); return; }
    setEmployees(prev => [...prev, r.data?.employee as Employee]);
    setShowEmpModal(false); setLoading(false);
  };

  const handleAddSalary = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    const emp = employees.find(x => x.id === salForm.employee_id);
    if (!emp) { setError('اختر موظف'); setLoading(false); return; }
    const base = emp.base_salary;
    const bonuses = Number(salForm.bonuses) || 0;
    const deductions = Number(salForm.deductions) || 0;
    const net = base + bonuses - deductions;
    const r = await createSalaryRecord({ employee_id: salForm.employee_id, month: salForm.month, base_amount: base, bonuses, deductions, net_amount: net });
    if (!r.success) { setError(r.error || 'خطأ'); setLoading(false); return; }
    setRecords(prev => [r.data?.record as SalaryRow, ...prev]);
    setShowSalModal(false); setLoading(false);
  };

  const handlePay = async (id: string) => {
    const r = await paySalary(id);
    if (r.success) setRecords(prev => prev.map(rec => rec.id === id ? { ...rec, status: 'paid', paid_date: new Date().toISOString().split('T')[0] } : rec));
  };

  return (
    <>
      <div className="sec-header">
        <div><div className="sec-title">مرتبات الموظفين <span>👤</span></div>
          <div className="sec-sub">{employees.length} موظف نشط</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => setShowEmpModal(true)}>👤 موظف جديد</button>
          <button className="btn btn-primary" onClick={() => setShowSalModal(true)}>📄 صرف مرتب</button>
        </div>
      </div>

      <div className="card"><div className="card-body">
        {records.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>لا توجد سجلات مرتبات</div> :
          records.map(rec => (
            <div className="salary-card" key={rec.id}>
              <div className="salary-header">
                <div><div style={{ fontWeight: 800 }}>{rec.employee?.full_name || '—'}</div><div style={{ fontSize: 11, color: 'var(--muted)' }}>{rec.employee?.role} • {rec.month?.substring(0, 7)}</div></div>
                <span className={`badge ${rec.status === 'paid' ? 'badge-green' : 'badge-gold'}`}>{rec.status === 'paid' ? 'مصروف ✓' : 'معلق'}</span>
              </div>
              <div className="salary-amounts">
                <div className="salary-item"><span className="salary-val">{Number(rec.base_amount).toLocaleString()}</span><span className="salary-lbl">الأساسي</span></div>
                <div className="salary-item"><span className="salary-val" style={{ color: 'var(--green)' }}>+{Number(rec.bonuses).toLocaleString()}</span><span className="salary-lbl">بدلات</span></div>
                <div className="salary-item"><span className="salary-val" style={{ color: 'var(--red)' }}>-{Number(rec.deductions).toLocaleString()}</span><span className="salary-lbl">خصومات</span></div>
                <div className="salary-item"><span className="salary-val" style={{ color: 'var(--teal)' }}>{Number(rec.net_amount).toLocaleString()}</span><span className="salary-lbl">الصافي</span></div>
              </div>
              {rec.status !== 'paid' && <div style={{ marginTop: 12 }}><button className="btn btn-sm btn-primary" onClick={() => handlePay(rec.id)}>💵 صرف</button></div>}
            </div>
          ))}
      </div></div>

      <Modal isOpen={showEmpModal} onClose={() => setShowEmpModal(false)} title="موظف جديد">
        <form onSubmit={handleAddEmployee}>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          <div className="form-grid">
            <div className="form-group"><label className="form-label">الاسم *</label><input className="form-input" value={empForm.full_name} onChange={e => setEmpForm(f => ({ ...f, full_name: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">الوظيفة</label><input className="form-input" value={empForm.role} onChange={e => setEmpForm(f => ({ ...f, role: e.target.value }))} /></div>
            <div className="form-group full"><label className="form-label">المرتب الأساسي *</label><input type="number" className="form-input" value={empForm.base_salary} onChange={e => setEmpForm(f => ({ ...f, base_salary: e.target.value }))} required min={0} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'جاري...' : '➕ إضافة'}</button><button className="btn btn-outline" type="button" onClick={() => setShowEmpModal(false)}>إلغاء</button></div>
        </form>
      </Modal>

      <Modal isOpen={showSalModal} onClose={() => setShowSalModal(false)} title="📄 صرف مرتب">
        <form onSubmit={handleAddSalary}>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          <div className="form-grid">
            <div className="form-group full"><label className="form-label">الموظف *</label><select className="form-input" value={salForm.employee_id} onChange={e => setSalForm(f => ({ ...f, employee_id: e.target.value }))} required><option value="">اختر...</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name} — {emp.base_salary} ج.م</option>)}</select></div>
            <div className="form-group"><label className="form-label">الشهر</label><input type="date" className="form-input" value={salForm.month} onChange={e => setSalForm(f => ({ ...f, month: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">بدلات</label><input type="number" className="form-input" value={salForm.bonuses} onChange={e => setSalForm(f => ({ ...f, bonuses: e.target.value }))} min={0} /></div>
            <div className="form-group"><label className="form-label">خصومات</label><input type="number" className="form-input" value={salForm.deductions} onChange={e => setSalForm(f => ({ ...f, deductions: e.target.value }))} min={0} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'جاري...' : '📄 صرف'}</button><button className="btn btn-outline" type="button" onClick={() => setShowSalModal(false)}>إلغاء</button></div>
        </form>
      </Modal>
    </>
  );
}
