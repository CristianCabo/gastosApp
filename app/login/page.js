'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError('Email o contraseña incorrectos.'); return; }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Iniciar sesión</h1>
        <p className="auth-sub">Entrá para ver y cargar tus gastos.</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label className="field-label">Contraseña</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <div className="auth-foot">
          <Link href="/forgot-password">¿Olvidaste tu contraseña?</Link>
        </div>
        <div className="auth-foot">
          ¿No tenés cuenta? <Link href="/register">Registrate</Link>
        </div>
      </div>
    </div>
  );
}
