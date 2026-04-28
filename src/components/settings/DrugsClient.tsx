'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { addFrequentDrug, deleteFrequentDrug } from '@/lib/actions/drugs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DrugsClient({ initialDrugs }: { initialDrugs: any[] }) {
  const [drugs, setDrugs] = useState(initialDrugs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    drug_name: '',
    dose: '',
    frequency: '',
    duration: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.drug_name) {
      setError('يرجى إدخال اسم الدواء');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    const res = await addFrequentDrug(formData);
    
    if (res.success) {
      setIsModalOpen(false);
      window.location.reload(); // Simple optimistic refresh
    } else {
      setError(res.error || 'حدث خطأ غير معروف');
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الدواء "${name}" من القائمة المفضلة؟`)) {
      const res = await deleteFrequentDrug(id);
      if (res.success) {
        setDrugs(drugs.filter(d => d.id !== id));
      } else {
        alert(res.error);
      }
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">قائمة الأدوية ({drugs.length})</span>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ إضافة دواء للقائمة</button>
        </div>
        <div className="card-body">
          {drugs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
              لم تقم بإضافة أي أدوية مفضلة بعد
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>اسم الدواء</th>
                    <th>الجرعة</th>
                    <th>التكرار</th>
                    <th>المدة</th>
                    <th>ملاحظات</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {drugs.map(drug => (
                    <tr key={drug.id}>
                      <td style={{ fontWeight: 700, color: 'var(--teal2)' }}>{drug.drug_name}</td>
                      <td>{drug.dose || '-'}</td>
                      <td>{drug.frequency || '-'}</td>
                      <td>{drug.duration || '-'}</td>
                      <td>{drug.notes || '-'}</td>
                      <td>
                        <button 
                          className="btn btn-red btn-sm" 
                          onClick={() => handleDelete(drug.id, drug.drug_name)}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title="إضافة دواء للكتالوج">
        {error && <div className="alert-banner alert-red" style={{ marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <div className="form-group full">
              <label className="form-label">اسم الدواء *</label>
              <input 
                className="form-input" 
                type="text" 
                placeholder="مثال: Augmentin 1g"
                value={formData.drug_name}
                onChange={e => setFormData({...formData, drug_name: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">الجرعة المعتادة</label>
              <input 
                className="form-input" 
                type="text" 
                placeholder="مثال: قرص واحد"
                value={formData.dose}
                onChange={e => setFormData({...formData, dose: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">التكرار</label>
              <input 
                className="form-input" 
                type="text" 
                placeholder="مثال: كل 12 ساعة"
                value={formData.frequency}
                onChange={e => setFormData({...formData, frequency: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">المدة المعتادة</label>
              <input 
                className="form-input" 
                type="text" 
                placeholder="مثال: لمدة 5 أيام"
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: e.target.value})}
              />
            </div>

            <div className="form-group full">
              <label className="form-label">ملاحظات افتراضية</label>
              <input 
                className="form-input" 
                type="text" 
                placeholder="مثال: بعد الأكل"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : '+ حفظ الدواء'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
