'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) { setError('No pudimos enviar el email. Probá de nuevo.'); return; }
    setSent(true);
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Recuperar contraseña</h1>
        <p className="auth-sub">Te mandamos un link para elegir una contraseña nueva.</p>
        {error && <div className="auth-error">{error}</div>}
        {sent ? (
          <p style={{ fontSize: 14 }}>Listo, revisá tu email ({email}) para continuar.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="field-label">Email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Enviando…' : 'Enviar link'}
            </button>
          </form>
        )}
        <div className="auth-foot">
          <Link href="/login">Volver a iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}
