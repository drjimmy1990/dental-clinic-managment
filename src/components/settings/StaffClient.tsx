'use client';

import { useState } from 'react';
import { createStaffMember, toggleStaffStatus } from '@/lib/actions/staff';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function StaffClient({ initialStaff }: { initialStaff: any[] }) {
  const [staff, setStaff] = useState(initialStaff);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'assistant'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await createStaffMember(formData);
      
      if (res.success) {
        // Optimistic update - in a real app you'd fetch the fresh list
        // but revalidatePath will refresh on next navigation anyway
        setIsModalOpen(false);
        window.location.reload(); // Simple way to refresh data
      } else {
        setError(res.error || 'حدث خطأ غير معروف');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError('حدث خطأ في الخادم. تأكد من إعدادات SUPABASE_SERVICE_ROLE_KEY.');
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (confirm(`هل أنت متأكد من ${currentStatus ? 'إيقاف' : 'تفعيل'} هذا الحساب؟`)) {
      const res = await toggleStaffStatus(userId, !currentStatus);
      if (res.success) {
        setStaff(staff.map(s => s.id === userId ? { ...s, is_active: !currentStatus } : s));
      } else {
        alert(res.error);
      }
    }
  };

  const roleLabels: Record<string, string> = {
    owner: 'مدير النظام',
    doctor: 'طبيب',
    secretary: 'موظف استقبال',
    assistant: 'مساعد طبيب',
    technician: 'فني معمل'
  };

  const roleColors: Record<string, string> = {
    owner: 'badge-purple',
    doctor: 'badge-teal',
    secretary: 'badge-gold',
    assistant: 'badge-green',
    technician: 'badge-blue'
  };

  return (
    <>
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">فريق العمل ({staff.length})</span>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ إضافة موظف</button>
        </div>
        <div className="card-body">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الدور</th>
                  <th>تاريخ الإضافة</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(user => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600 }}>{user.full_name}</td>
                    <td>
                      <span className={`badge ${roleColors[user.role] || 'badge-gray'}`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString('ar-EG')}</td>
                    <td>
                      {user.is_active ? (
                        <span style={{ color: 'var(--green)' }}>🟢 نشط</span>
                      ) : (
                        <span style={{ color: 'var(--red)' }}>🔴 موقوف</span>
                      )}
                    </td>
                    <td>
                      {user.role !== 'owner' && (
                        <button 
                          className={`btn ${user.is_active ? 'btn-danger' : 'btn-primary'}`} 
                          style={{ padding: '4px 8px', fontSize: 12 }}
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                        >
                          {user.is_active ? 'إيقاف' : 'تفعيل'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">إضافة موظف جديد</h3>
              <button className="modal-close" onClick={() => !isSubmitting && setIsModalOpen(false)}>×</button>
            </div>
            
            {error && <div className="alert-banner alert-red" style={{ margin: '0 20px', marginTop: 20 }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                <div className="form-group full">
                  <label className="form-label">الاسم الكامل *</label>
                  <input 
                    className="form-input" 
                    type="text" 
                    required 
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                
                <div className="form-group full">
                  <label className="form-label">البريد الإلكتروني (لتسجيل الدخول) *</label>
                  <input 
                    className="form-input" 
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="example@clinic.com"
                  />
                </div>

                <div className="form-group full">
                  <label className="form-label">كلمة المرور *</label>
                  <input 
                    className="form-input" 
                    type="password" 
                    required 
                    minLength={6}
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <div className="form-group full">
                  <label className="form-label">الدور (الصلاحيات) *</label>
                  <select 
                    className="form-input" 
                    required
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="doctor">طبيب (صلاحيات كاملة عدا الإعدادات)</option>
                    <option value="secretary">موظف استقبال (تسجيل مرضى ومواعيد ومدفوعات)</option>
                    <option value="assistant">مساعد طبيب (إطلاع فقط)</option>
                    <option value="technician">فني معمل (إدارة المعمل)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الإضافة...' : '+ إضافة الموظف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
