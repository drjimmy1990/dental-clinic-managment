'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { createEquipment, logMaintenance, updateEquipmentStatus } from '@/lib/actions/maintenance';
import type { Equipment } from '@/types';

const statusMap: Record<string, { cls: string; label: string }> = {
  active: { cls: 'days-ok', label: 'يعمل' },
  needs_maintenance: { cls: 'days-warn', label: 'يحتاج صيانة' },
  under_maintenance: { cls: 'days-urgent', label: 'تحت الصيانة' },
  decommissioned: { cls: 'days-urgent', label: 'خارج الخدمة' },
};

export default function MaintenanceClient({ initialEquipment }: { initialEquipment: Equipment[] }) {
  const [equipment, setEquipment] = useState(initialEquipment);
  const [showAddModal, setShowAddModal] = useState(false);
  const [maintModal, setMaintModal] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', service_company: '', maintenance_cost: '', next_maintenance: '' });
  const [maintForm, setMaintForm] = useState({ date: new Date().toISOString().split('T')[0], company: '', cost: '', notes: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    const r = await createEquipment({ name: form.name, service_company: form.service_company || undefined, maintenance_cost: form.maintenance_cost ? Number(form.maintenance_cost) : 0, next_maintenance: form.next_maintenance || undefined });
    if (!r.success) { setError(r.error || 'خطأ'); setLoading(false); return; }
    setEquipment(prev => [r.data?.equipment as Equipment, ...prev]);
    setShowAddModal(false); setLoading(false);
    setForm({ name: '', service_company: '', maintenance_cost: '', next_maintenance: '' });
  };

  const handleMaint = async () => {
    if (!maintModal) return; setLoading(true);
    const r = await logMaintenance({ equipment_id: maintModal, date: maintForm.date, company: maintForm.company || undefined, cost: maintForm.cost ? Number(maintForm.cost) : 0, notes: maintForm.notes || undefined });
    if (r.success) {
      setEquipment(prev => prev.map(e => e.id === maintModal ? { ...e, last_maintenance: maintForm.date, status: 'active' as const } : e));
      setMaintModal(null);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, status: 'active' | 'needs_maintenance' | 'under_maintenance' | 'decommissioned') => {
    const r = await updateEquipmentStatus(id, status);
    if (r.success) setEquipment(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  const getDaysInfo = (nextDate: string | null) => {
    if (!nextDate) return null;
    const days = Math.ceil((new Date(nextDate).getTime() - Date.now()) / 86400000);
    if (days < 0) return { text: `متأخر ${Math.abs(days)} يوم`, cls: 'days-urgent' };
    if (days < 7) return { text: `${days} أيام`, cls: 'days-warn' };
    return { text: `${days} يوم`, cls: 'days-ok' };
  };

  return (
    <>
      <div className="sec-header">
        <div><div className="sec-title">صيانة الأجهزة <span>🔧</span></div>
          <div className="sec-sub">{equipment.length} جهاز</div></div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>➕ جهاز جديد</button>
      </div>
      <div className="card"><div className="card-body">
        {equipment.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>لا توجد أجهزة</div> :
          equipment.map(eq => {
            const badge = statusMap[eq.status] || statusMap.active;
            const daysInfo = getDaysInfo(eq.next_maintenance);
            return (<div className="maint-item" key={eq.id}>
              <div className="maint-icon">🔧</div>
              <div className="maint-info">
                <div className="maint-name">{eq.name}</div>
                <div className="maint-date">
                  {eq.service_company && `${eq.service_company} • `}
                  {eq.last_maintenance ? `آخر صيانة: ${eq.last_maintenance}` : 'لم تتم صيانة بعد'}
                  {eq.maintenance_cost > 0 && ` • ${eq.maintenance_cost} ج.م`}
                </div>
              </div>
              {daysInfo && <span className={`days-badge ${daysInfo.cls}`}>{daysInfo.text}</span>}
              <span className={`days-badge ${badge.cls}`}>{badge.label}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-sm btn-primary" onClick={() => setMaintModal(eq.id)}>🔧 صيانة</button>
                {eq.status === 'active' && <button className="btn btn-sm btn-gold" onClick={() => handleStatusChange(eq.id, 'needs_maintenance')}>⚠️</button>}
              </div>
            </div>);
          })}
      </div></div>
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="جهاز جديد">
        <form onSubmit={handleCreate}>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          <div className="form-grid">
            <div className="form-group"><label className="form-label">اسم الجهاز *</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">شركة الصيانة</label><input className="form-input" value={form.service_company} onChange={e => setForm(f => ({ ...f, service_company: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">تكلفة الصيانة</label><input type="number" className="form-input" value={form.maintenance_cost} onChange={e => setForm(f => ({ ...f, maintenance_cost: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">موعد الصيانة القادم</label><input type="date" className="form-input" value={form.next_maintenance} onChange={e => setForm(f => ({ ...f, next_maintenance: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'جاري...' : '➕ إضافة'}</button><button className="btn btn-outline" type="button" onClick={() => setShowAddModal(false)}>إلغاء</button></div>
        </form>
      </Modal>
      <Modal isOpen={!!maintModal} onClose={() => setMaintModal(null)} title="🔧 تسجيل صيانة">
        <div className="form-grid">
          <div className="form-group"><label className="form-label">التاريخ</label><input type="date" className="form-input" value={maintForm.date} onChange={e => setMaintForm(f => ({ ...f, date: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">الشركة</label><input className="form-input" value={maintForm.company} onChange={e => setMaintForm(f => ({ ...f, company: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">التكلفة</label><input type="number" className="form-input" value={maintForm.cost} onChange={e => setMaintForm(f => ({ ...f, cost: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">ملاحظات</label><input className="form-input" value={maintForm.notes} onChange={e => setMaintForm(f => ({ ...f, notes: e.target.value }))} /></div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}><button className="btn btn-primary" onClick={handleMaint} disabled={loading}>{loading ? 'جاري...' : '🔧 تسجيل'}</button><button className="btn btn-outline" onClick={() => setMaintModal(null)}>إلغاء</button></div>
      </Modal>
    </>
  );
}
