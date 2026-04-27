'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { createPatient, updatePatient, deletePatient } from '@/lib/actions/patients';
import type { Patient } from '@/types';
import type { PatientInput } from '@/lib/validations/schemas';

interface PatientsClientProps {
  initialPatients: Patient[];
}

const emptyForm: PatientInput = {
  full_name: '',
  phone: '',
  age: null,
  gender: null,
  address: '',
  has_blood_pressure: false,
  has_diabetes: false,
  has_anesthesia_allergy: false,
  medical_notes: '',
};

export default function PatientsClient({ initialPatients }: PatientsClientProps) {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<PatientInput>(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredPatients = patients.filter(p => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(s) ||
      p.phone?.toLowerCase().includes(s) ||
      p.code?.toLowerCase().includes(s)
    );
  });

  const openAdd = () => {
    setForm(emptyForm);
    setEditingPatient(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (patient: Patient) => {
    setForm({
      full_name: patient.full_name,
      phone: patient.phone || '',
      age: patient.age,
      gender: patient.gender as 'male' | 'female' | null,
      address: patient.address || '',
      has_blood_pressure: patient.has_blood_pressure,
      has_diabetes: patient.has_diabetes,
      has_anesthesia_allergy: patient.has_anesthesia_allergy,
      medical_notes: patient.medical_notes || '',
    });
    setEditingPatient(patient);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = editingPatient
      ? await updatePatient(editingPatient.id, form)
      : await createPatient(form);

    if (!result.success) {
      setError(result.error || 'حدث خطأ');
      setLoading(false);
      return;
    }

    // Refresh patient list
    if (editingPatient) {
      setPatients(prev =>
        prev.map(p => p.id === editingPatient.id ? { ...p, ...form } as Patient : p)
      );
    } else {
      const newPatient = result.data?.patient as Patient;
      setPatients(prev => [newPatient, ...prev]);
    }

    setShowModal(false);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const result = await deletePatient(id);
    if (result.success) {
      setPatients(prev => prev.filter(p => p.id !== id));
      setDeleteConfirm(null);
    }
  };

  const updateField = (field: keyof PatientInput, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <div className="sec-header">
        <div>
          <div className="sec-title">المرضى <span>🧑‍⚕️</span></div>
          <div className="sec-sub">{patients.length} مريض مسجل</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>➕ مريض جديد</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <div className="topbar-search" style={{ maxWidth: 400 }}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="بحث بالاسم أو الكود أو الموبايل..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="card">
        <div className="card-body">
          {filteredPatients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
              {search ? 'لا توجد نتائج للبحث' : 'لا يوجد مرضى بعد — أضف أول مريض'}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>الكود</th>
                    <th>الاسم</th>
                    <th>الموبايل</th>
                    <th>العمر</th>
                    <th>النوع</th>
                    <th>حالات طبية</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(patient => (
                    <tr key={patient.id}>
                      <td>
                        <span className="badge badge-teal">{patient.code || '—'}</span>
                      </td>
                      <td>
                        <a href={`/patients/${patient.id}`} style={{ color: 'var(--teal)', fontWeight: 700, textDecoration: 'none' }}>
                          {patient.full_name}
                        </a>
                      </td>
                      <td style={{ direction: 'ltr', textAlign: 'right' }}>{patient.phone || '—'}</td>
                      <td>{patient.age || '—'}</td>
                      <td>{patient.gender === 'male' ? 'ذكر' : patient.gender === 'female' ? 'أنثى' : '—'}</td>
                      <td>
                        {patient.has_blood_pressure && <span className="badge badge-red" style={{ marginLeft: 4 }}>ضغط</span>}
                        {patient.has_diabetes && <span className="badge badge-gold" style={{ marginLeft: 4 }}>سكر</span>}
                        {patient.has_anesthesia_allergy && <span className="badge badge-purple" style={{ marginLeft: 4 }}>حساسية بنج</span>}
                        {!patient.has_blood_pressure && !patient.has_diabetes && !patient.has_anesthesia_allergy && '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(patient)}>✏️</button>
                          <button
                            className="btn btn-red btn-sm"
                            onClick={() => setDeleteConfirm(patient.id)}
                          >🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPatient ? `تعديل: ${editingPatient.full_name}` : 'إضافة مريض جديد'}
      >
        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">الاسم الكامل *</label>
              <input
                className="form-input"
                value={form.full_name}
                onChange={e => updateField('full_name', e.target.value)}
                placeholder="اسم المريض"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">رقم الموبايل</label>
              <input
                className="form-input"
                value={form.phone || ''}
                onChange={e => updateField('phone', e.target.value)}
                placeholder="01xxxxxxxxx"
              />
            </div>
            <div className="form-group">
              <label className="form-label">العمر</label>
              <input
                className="form-input"
                type="number"
                value={form.age ?? ''}
                onChange={e => updateField('age', e.target.value ? Number(e.target.value) : null)}
                placeholder="العمر"
                min={0}
                max={120}
              />
            </div>
            <div className="form-group">
              <label className="form-label">النوع</label>
              <select
                className="form-input"
                value={form.gender || ''}
                onChange={e => updateField('gender', e.target.value || null)}
              >
                <option value="">اختر</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>
            <div className="form-group full">
              <label className="form-label">العنوان</label>
              <input
                className="form-input"
                value={form.address || ''}
                onChange={e => updateField('address', e.target.value)}
                placeholder="العنوان"
              />
            </div>
          </div>

          {/* Medical Conditions */}
          <div style={{ margin: '16px 0', padding: 16, background: 'var(--bg3)', borderRadius: 12 }}>
            <div className="form-label" style={{ marginBottom: 12 }}>⚠️ حالات طبية</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={form.has_blood_pressure}
                  onChange={e => updateField('has_blood_pressure', e.target.checked)}
                />
                ضغط دم مرتفع
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={form.has_diabetes}
                  onChange={e => updateField('has_diabetes', e.target.checked)}
                />
                مرض السكر
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={form.has_anesthesia_allergy}
                  onChange={e => updateField('has_anesthesia_allergy', e.target.checked)}
                />
                حساسية من البنج
              </label>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">ملاحظات طبية</label>
            <textarea
              className="form-input"
              value={form.medical_notes || ''}
              onChange={e => updateField('medical_notes', e.target.value)}
              placeholder="أي ملاحظات طبية..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start' }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : editingPatient ? '💾 حفظ التعديل' : '➕ إضافة المريض'}
            </button>
            <button className="btn btn-outline" type="button" onClick={() => setShowModal(false)}>
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="⚠️ حذف مريض"
      >
        <p style={{ marginBottom: 20, color: 'var(--muted)' }}>
          هل أنت متأكد من حذف هذا المريض؟ سيتم حذف جميع بياناته ومواعيده.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-red" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
            🗑️ نعم، احذف
          </button>
          <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>
            إلغاء
          </button>
        </div>
      </Modal>
    </>
  );
}
