'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon, ConfirmModal, useToasts, ToastStack } from '@/components/ui';
import { useAppData } from '@/lib/use-app-data';
import { createClient } from '@/lib/supabase-browser';
import { CURRENCIES, PAYMENT_METHODS } from '@/lib/constants';

export default function SettingsPage() {
  const { profile, categories, loading, setProfile } = useAppData();
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [toasts, toast] = useToasts();
  const router = useRouter();
  const supabase = createClient();

  async function updateProfile(patch) {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    if (res.ok) {
      setProfile((p) => ({ ...p, ...patch }));
      if (patch.theme) {
        if (patch.theme === 'auto') document.documentElement.removeAttribute('data-theme');
        else document.documentElement.setAttribute('data-theme', patch.theme);
      }
    } else {
      toast('No pudimos guardar el cambio.', 'error');
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    setJoinError('');
    setJoining(true);
    const res = await fetch('/api/household/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: joinCode }),
    });
    const json = await res.json();
    setJoining(false);
    if (!res.ok) { setJoinError(json.error || 'No pudimos unirte a ese hogar.'); return; }
    toast('¡Listo! Ahora compartís los gastos de ese hogar.');
    router.refresh();
    setTimeout(() => window.location.reload(), 600);
  }

  async function handleDeleteAccount() {
    setDeleteConfirm(false);
    const res = await fetch('/api/account/delete', { method: 'POST' });
    if (res.ok) {
      await supabase.auth.signOut();
      router.push('/login');
    } else {
      toast('No pudimos eliminar la cuenta. Probá de nuevo.', 'error');
    }
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Cargando…</div>;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-sub">Preferencias de la aplicación.</p>
        </div>
      </div>

      <div className="card settings-block">
        <div className="settings-row">
          <div><div className="settings-row-label">Nombre</div><div className="settings-row-sub">{profile?.email}</div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}><Icon name="user" size={16} /> {profile?.name || '—'}</div>
        </div>
        <div className="settings-row">
          <div><div className="settings-row-label">Moneda</div><div className="settings-row-sub">Se aplica a todos los montos de la app.</div></div>
          <div className="currency-toggle">
            {Object.keys(CURRENCIES).map((k) => (
              <button key={k} className={profile?.currency === k ? 'is-active' : ''} onClick={() => updateProfile({ currency: k })}>{k}</button>
            ))}
          </div>
        </div>
        <div className="settings-row">
          <div><div className="settings-row-label">Tema</div><div className="settings-row-sub">Claro, oscuro o según el sistema.</div></div>
          <div className="theme-toggle">
            <button className={profile?.theme === 'light' ? 'is-active' : ''} onClick={() => updateProfile({ theme: 'light' })}><Icon name="sun" size={14} /></button>
            <button className={profile?.theme === 'auto' ? 'is-active' : ''} onClick={() => updateProfile({ theme: 'auto' })}>Auto</button>
            <button className={profile?.theme === 'dark' ? 'is-active' : ''} onClick={() => updateProfile({ theme: 'dark' })}><Icon name="moon" size={14} /></button>
          </div>
        </div>
      </div>

      <div className="card settings-block">
        <div className="settings-row">
          <div>
            <div className="settings-row-label"><Icon name="users" size={14} style={{ verticalAlign: -2, marginRight: 4 }} /> Hogar compartido</div>
            <div className="settings-row-sub">{profile?.household?.name} · {profile?.memberCount} {profile?.memberCount === 1 ? 'persona' : 'personas'}</div>
          </div>
          <span className="invite-code">{profile?.household?.invite_code}</span>
        </div>
        <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div className="settings-row-sub" style={{ marginBottom: 10 }}>
            Compartí ese código con la otra persona: al registrarse (o desde acá si ya tiene cuenta), puede unirse y van a ver y cargar los mismos gastos.
          </div>
          <form onSubmit={handleJoin} style={{ display: 'flex', gap: 8 }}>
            <input className="input" placeholder="Unirme a otro hogar con un código" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} style={{ maxWidth: 260 }} />
            <button className="btn" disabled={joining}>{joining ? 'Uniendo…' : 'Unirme'}</button>
          </form>
          {joinError && <div className="field-error">{joinError}</div>}
        </div>
      </div>

      <div className="card settings-block">
        <div className="settings-row">
          <div><div className="settings-row-label">Categorías</div><div className="settings-row-sub">{categories.filter((c) => c.is_active !== false).length} activas de {categories.length}</div></div>
        </div>
        <div className="settings-row">
          <div><div className="settings-row-label">Métodos de pago</div><div className="settings-row-sub">{PAYMENT_METHODS.join(', ')}</div></div>
        </div>
      </div>

      <div className="card settings-block">
        <div className="settings-row">
          <div><div className="settings-row-label" style={{ color: 'var(--danger)' }}>Eliminar cuenta</div><div className="settings-row-sub">Se borra tu acceso. Los gastos del hogar quedan para quienes sigan siendo miembros.</div></div>
          <button className="btn btn-danger" onClick={() => setDeleteConfirm(true)}>Eliminar cuenta</button>
        </div>
      </div>

      <ConfirmModal
        open={deleteConfirm}
        title="¿Eliminar tu cuenta?"
        body="Esta acción no se puede deshacer. Vas a perder el acceso a la aplicación."
        confirmLabel="Eliminar cuenta"
        danger
        onCancel={() => setDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
      />
      <ToastStack toasts={toasts} />
    </div>
  );
}
