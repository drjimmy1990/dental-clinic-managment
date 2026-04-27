'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [clinicName, setClinicName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Sign up user and pass clinic data as metadata
      // The Postgres trigger on_auth_user_created will automatically create the clinic and user profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            clinicName,
            doctorName,
            phone: phone || '',
          }
        }
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('حدث خطأ أثناء إنشاء الحساب');
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('حدث خطأ غير متوقع');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="logo-icon" style={{ width: 56, height: 56, fontSize: 28, margin: '0 auto 16px', borderRadius: 14 }}>
            🦷
          </div>
          <div className="auth-title">إنشاء عيادة جديدة</div>
          <div className="auth-sub">سجّل عيادتك وابدأ إدارتها الآن</div>
        </div>

        <form className="auth-form" onSubmit={handleRegister}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">اسم العيادة</label>
              <input className="form-input" placeholder="عيادة الابتسامة" value={clinicName} onChange={(e) => setClinicName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">اسم الدكتور</label>
              <input className="form-input" placeholder="د. أحمد سالم" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">تليفون العيادة</label>
              <input className="form-input" placeholder="0100-000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">البريد الإلكتروني</label>
              <input className="form-input" type="email" placeholder="doctor@clinic.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group full">
              <label className="form-label">كلمة السر</label>
              <input className="form-input" type="password" placeholder="6 أحرف على الأقل" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
          </div>

          <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} disabled={loading}>
            {loading ? 'جاري الإنشاء...' : '🏥 إنشاء العيادة'}
          </button>
        </form>

        <div className="auth-link">
          لديك حساب بالفعل؟ <a href="/login">تسجيل الدخول</a>
        </div>
      </div>
    </div>
  );
}
