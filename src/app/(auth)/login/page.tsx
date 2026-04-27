'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('البريد الإلكتروني أو كلمة السر غير صحيحة');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="logo-icon" style={{ width: 56, height: 56, fontSize: 28, margin: '0 auto 16px', borderRadius: 14 }}>
            🦷
          </div>
          <div className="auth-title">DentaCare Pro</div>
          <div className="auth-sub">سجّل دخولك لإدارة العيادة</div>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">البريد الإلكتروني</label>
            <input
              className="form-input"
              type="email"
              placeholder="doctor@clinic.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">كلمة السر</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? 'جاري الدخول...' : '🔐 تسجيل الدخول'}
          </button>
        </form>

        <div className="auth-link">
          ليس لديك حساب؟ <a href="/register">إنشاء عيادة جديدة</a>
        </div>
      </div>
    </div>
  );
}
