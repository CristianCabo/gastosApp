'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';

export default function RegisterPage() {
  const supabase = createClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setLoading(false);
    if (error) { setError(error.message === 'User already registered' ? 'Ese email ya tiene una cuenta.' : 'No pudimos crear la cuenta. Probá de nuevo.'); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1 className="auth-title">Revisá tu email</h1>
          <p className="auth-sub">Te enviamos un link para confirmar tu cuenta. Una vez confirmada, iniciá sesión.</p>
          <Link className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} href="/login">Ir a iniciar sesión</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-sub">Vas a tener tu propio hogar de gastos; después podés invitar a otra persona con un código.</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label">Nombre</label>
            <input className="input" type="text" required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label className="field-label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Contraseña</label>
            <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>
        <div className="auth-foot">
          ¿Ya tenés cuenta? <Link href="/login">Iniciá sesión</Link>
        </div>
      </div>
    </div>
  );
}
