'use client';

import { useState } from 'react';
import Modal from '../ui/Modal';
import { createPrescription, deletePrescription } from '@/lib/actions/prescriptions';

import { addFrequentDrug } from '@/lib/actions/drugs';

interface PrescriptionsTabProps {
  patientId: string;
  clinicName?: string;
  doctorName?: string;
  prescriptions: any[]; // will properly type if we had types/index.ts updated
  frequentDrugs: any[];
}

export default function PrescriptionsTab({ patientId, clinicName, doctorName, prescriptions, frequentDrugs }: PrescriptionsTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [items, setItems] = useState([{ drug_name: '', dose: '', frequency: '', duration: '', notes: '' }]);
  const [generalNotes, setGeneralNotes] = useState('');

  const [printData, setPrintData] = useState<any>(null);

  const handleAddItem = () => {
    setItems([...items, { drug_name: '', dose: '', frequency: '', duration: '', notes: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill if drug name matches a frequent drug
    if (field === 'drug_name') {
      const template = frequentDrugs.find(d => d.drug_name === value);
      if (template) {
        newItems[index] = {
          ...newItems[index],
          dose: template.dose || newItems[index].dose,
          frequency: template.frequency || newItems[index].frequency,
          duration: template.duration || newItems[index].duration,
          notes: template.notes || newItems[index].notes,
        };
      }
    }
    
    setItems(newItems);
  };

  const saveToFavorites = async (item: any) => {
    if (!item.drug_name) return;
    const res = await addFrequentDrug(item);
    if (res.success) {
      alert(`تم حفظ الدواء "${item.drug_name}" في المفضلة بنجاح!`);
    } else {
      alert(res.error || 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some(i => !i.drug_name)) {
      setError('الرجاء إدخال اسم الدواء لجميع العناصر');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createPrescription({
        patient_id: patientId,
        notes: generalNotes,
        items
      });
      setIsAdding(false);
      setItems([{ drug_name: '', dose: '', frequency: '', duration: '', notes: '' }]);
      setGeneralNotes('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (p: any) => {
    setPrintData(p);
    setTimeout(() => {
      window.print();
      setPrintData(null);
    }, 100);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>الروشتات الطبية</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setIsAdding(true)}>+ روشتة جديدة</button>
      </div>

      {!prescriptions || prescriptions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)', background: '#fff', borderRadius: 8 }}>لا توجد روشتات سابقة</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {prescriptions.map((p) => (
            <div key={p.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                  📅 {new Date(p.created_at).toLocaleDateString('ar-EG')} 
                  <span style={{ margin: '0 8px' }}>•</span> 
                  ⏰ {new Date(p.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div>
                  <button className="btn btn-sm btn-outline" style={{ border: 'none', padding: '4px 8px', marginRight: 8 }} onClick={() => handlePrint(p)}>🖨️ طباعة</button>
                  <button className="btn btn-sm btn-outline" style={{ border: 'none', padding: '4px 8px', color: 'var(--red)' }} onClick={() => confirm('تأكيد الحذف؟') && deletePrescription(p.id, patientId)}>🗑️</button>
                </div>
              </div>
              
              <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
                {p.prescription_items?.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 8, marginBottom: 8 }}>
                    <div>
                      <strong style={{ fontSize: 15, color: 'var(--primary)' }}>{item.drug_name}</strong>
                      <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 4 }}>
                        {item.dose && <span style={{ marginLeft: 12 }}>الجرعة: {item.dose}</span>}
                        {item.frequency && <span style={{ marginLeft: 12 }}>التكرار: {item.frequency}</span>}
                        {item.duration && <span style={{ marginLeft: 12 }}>المدة: {item.duration}</span>}
                      </div>
                      {item.notes && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>ملاحظات: {item.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
              {p.notes && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>ملاحظات عامة: {p.notes}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="إضافة روشتة جديدة">
        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {items.map((item, index) => (
              <div key={index} style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong>دواء {index + 1}</strong>
                  <div>
                    <button type="button" onClick={() => saveToFavorites(item)} style={{ color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', marginRight: 12, fontSize: 13 }}>⭐ حفظ كمفضل</button>
                    {items.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItem(index)} style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>حذف ✕</button>
                    )}
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">اسم الدواء *</label>
                    <input className="form-input" list="frequent-drugs" style={{ direction: 'ltr', textAlign: 'left' }} placeholder="e.g. Augmentin 1g" value={item.drug_name} onChange={e => handleItemChange(index, 'drug_name', e.target.value)} required />
                    <datalist id="frequent-drugs">
                      {frequentDrugs.map(d => <option key={d.id} value={d.drug_name} />)}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label className="form-label">الجرعة</label>
                    <input className="form-input" placeholder="قرص واحد" value={item.dose} onChange={e => handleItemChange(index, 'dose', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">التكرار</label>
                    <input className="form-input" placeholder="كل 12 ساعة" value={item.frequency} onChange={e => handleItemChange(index, 'frequency', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">المدة</label>
                    <input className="form-input" placeholder="لمدة 5 أيام" value={item.duration} onChange={e => handleItemChange(index, 'duration', e.target.value)} />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">ملاحظات إضافية (اختياري)</label>
                    <input className="form-input" placeholder="بعد الأكل" value={item.notes} onChange={e => handleItemChange(index, 'notes', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className="btn btn-outline btn-sm" onClick={handleAddItem} style={{ alignSelf: 'flex-start' }}>+ إضافة دواء آخر</button>

            <div className="form-group full" style={{ marginTop: 8 }}>
              <label className="form-label">ملاحظات عامة للروشتة (اختياري)</label>
              <textarea className="form-input" rows={2} value={generalNotes} onChange={e => setGeneralNotes(e.target.value)} />
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'جاري الحفظ...' : 'حفظ الروشتة'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setIsAdding(false)}>إلغاء</button>
          </div>
        </form>
      </Modal>

      {/* Print Layout */}
      {printData && (
        <div className="print-receipt" style={{ direction: 'rtl', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 20, marginBottom: 30 }}>
            <h1 style={{ margin: '0 0 10px 0', color: '#00d68f' }}>{clinicName || 'DentaCare Clinic'}</h1>
            <h3 style={{ margin: 0 }}>{doctorName}</h3>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, fontSize: 14 }}>
            <div><strong>التاريخ:</strong> {new Date(printData.created_at).toLocaleDateString('ar-EG')}</div>
            <div><strong>الوقت:</strong> {new Date(printData.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>

          <div style={{ minHeight: 400 }}>
            <h2 style={{ fontSize: 32, fontFamily: 'serif', marginBottom: 30, color: '#000' }}>Rx</h2>
            {printData.prescription_items?.map((item: any, i: number) => (
              <div key={i} style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 20, fontWeight: 'bold', direction: 'ltr', textAlign: 'left', marginBottom: 8 }}>{item.drug_name}</div>
                <div style={{ fontSize: 16, marginRight: 20 }}>
                  {item.dose && <span>{item.dose} </span>}
                  {item.frequency && <span>- {item.frequency} </span>}
                  {item.duration && <span>- {item.duration} </span>}
                </div>
                {item.notes && <div style={{ fontSize: 14, marginRight: 20, marginTop: 4, color: '#555' }}>({item.notes})</div>}
              </div>
            ))}

            {printData.notes && (
              <div style={{ marginTop: 40, borderTop: '1px dashed #ccc', paddingTop: 20 }}>
                <strong>ملاحظات طبية:</strong> {printData.notes}
              </div>
            )}
          </div>

          <div style={{ marginTop: 50, textAlign: 'left', paddingLeft: 40 }}>
            <div>الختم / التوقيع</div>
            <div style={{ borderBottom: '1px solid #000', width: 200, marginTop: 40 }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
