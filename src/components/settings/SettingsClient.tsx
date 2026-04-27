'use client';
import { useState } from 'react';
import { updateClinicInfo, signOut } from '@/lib/actions/settings';
import { useRouter } from 'next/navigation';
import type { Clinic } from '@/types';

export default function SettingsClient({ clinic }: { clinic: Clinic }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: clinic.name,
    doctor_name: clinic.doctor_name || '',
    phone: clinic.phone || '',
    address: clinic.address || '',
    working_hours: clinic.working_hours || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(false); setLoading(true);
    const r = await updateClinicInfo(form);
    if (!r.success) { setError(r.error || 'خطأ'); setLoading(false); return; }
    setSuccess(true); setLoading(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <>
      <div className="sec-header">
        <div>
          <div className="sec-title">الإعدادات <span>⚙️</span></div>
          <div className="sec-sub">إعدادات العيادة والحساب</div>
        </div>
      </div>

      <div className="grid-main">
        <div className="card">
          <div className="card-header"><span className="card-title">🏥 بيانات العيادة</span></div>
          <div className="card-body">
            <form onSubmit={handleSave}>
              {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
              {success && <div className="alert-banner alert-info" style={{ marginBottom: 16 }}>✅ تم الحفظ بنجاح</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">اسم العيادة *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">اسم الدكتور</label>
                  <input className="form-input" value={form.doctor_name} onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">تليفون العيادة</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01xxxxxxxxx" />
                </div>
                <div className="form-group">
                  <label className="form-label">ساعات العمل</label>
                  <input className="form-input" value={form.working_hours} onChange={e => setForm(f => ({ ...f, working_hours: e.target.value }))} placeholder="10 ص - 8 م" />
                </div>
                <div className="form-group full">
                  <label className="form-label">العنوان</label>
                  <input className="form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="عنوان العيادة" />
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'جاري الحفظ...' : '💾 حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><span className="card-title">ℹ️ معلومات النظام</span></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>الإصدار</span>
                  <span style={{ fontWeight: 700 }}>DentaCare Pro v1.0</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>تاريخ التسجيل</span>
                  <span style={{ fontWeight: 700 }}>{new Date(clinic.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>معرّف العيادة</span>
                  <span style={{ fontWeight: 700, fontSize: 10, color: 'var(--muted)' }}>{clinic.id.substring(0, 8)}...</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">🚪 الحساب</span></div>
            <div className="card-body">
              <button className="btn btn-red" onClick={handleSignOut} style={{ width: '100%', justifyContent: 'center' }}>
                🚪 تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
