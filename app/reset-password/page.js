'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError('No pudimos actualizar la contraseña. Pedí un nuevo link.'); return; }
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 1200);
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Elegí una contraseña nueva</h1>
        {error && <div className="auth-error">{error}</div>}
        {done ? (
          <p style={{ fontSize: 14 }}>Listo, ya podés usarla para entrar.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="field-label">Contraseña nueva</label>
              <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>{loading ? 'Guardando…' : 'Guardar contraseña'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
