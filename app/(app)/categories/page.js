'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Icon, ConfirmModal, useToasts, ToastStack } from '@/components/ui';
import { useAppData } from '@/lib/use-app-data';
import { CategoryFormModal } from '@/components/category-form-modal';

export default function CategoriesPage() {
  const { categories, loading, reloadCategories } = useAppData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [usedCounts, setUsedCounts] = useState({});
  const [toasts, toast] = useToasts();

  const loadUsedCounts = useCallback(async () => {
    const res = await fetch('/api/statistics?type=categories&from=0001-01-01&to=9999-12-31');
    const json = await res.json();
    const m = {};
    (json.data || []).forEach((x) => { m[x.categoryId] = x.total; });
    setUsedCounts(m);
  }, []);

  useEffect(() => { loadUsedCounts(); }, [loadUsedCounts]);

  async function saveCategory(data, id) {
    const res = await fetch(id ? `/api/categories/${id}` : '/api/categories', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) { toast(id ? 'Categoría actualizada.' : 'Categoría creada.'); reloadCategories(); }
    else {
      const json = await res.json().catch(() => null);
      toast(json?.error || 'No pudimos guardar la categoría.', 'error');
    }
  }

  async function toggleActive(id, isActive) {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });
    if (res.ok) reloadCategories();
  }

  async function handleConfirmDelete() {
    const c = confirmTarget;
    setConfirmTarget(null);
    if (!c) return;
    const res = await fetch(`/api/categories/${c.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) { toast('No pudimos eliminar la categoría.', 'error'); return; }
    toast(json.deactivated ? 'Categoría desactivada (tiene gastos asociados).' : 'Categoría eliminada.');
    reloadCategories();
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Categorías</h1>
          <p className="page-sub">Organizá tus gastos por tipo.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Icon name="plus" size={16} /> Nueva categoría</button>
      </div>

      {loading ? <div style={{ color: 'var(--text-muted)' }}>Cargando…</div> : (
        <div className="cat-grid">
          {categories.map((c) => (
            <div className={'cat-tile' + (c.is_active === false ? ' is-inactive' : '')} key={c.id}>
              <div className="cat-tile-icon" style={{ background: c.color + '22' }}>{c.icon}</div>
              <div>
                <div className="cat-tile-name">{c.name}</div>
                <div className="cat-tile-meta">{usedCounts[c.id] ? 'con gastos' : 'sin gastos'} {c.is_active === false ? '· inactiva' : ''}</div>
              </div>
              <div className="cat-tile-actions">
                <button className="icon-btn" onClick={() => { setEditing(c); setFormOpen(true); }}><Icon name="edit" size={14} /></button>
                {c.is_active === false ? (
                  <button className="icon-btn" onClick={() => toggleActive(c.id, true)}><Icon name="check" size={14} /></button>
                ) : (
                  <button className="icon-btn" onClick={() => setConfirmTarget(c)}><Icon name="trash" size={14} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryFormModal open={formOpen} initial={editing} onClose={() => setFormOpen(false)} onSave={saveCategory} />
      <ConfirmModal
        open={!!confirmTarget}
        title="¿Eliminar categoría?"
        body={confirmTarget && usedCounts[confirmTarget.id]
          ? 'Esta categoría tiene gastos asociados: se desactivará en lugar de eliminarse, y esos gastos se conservan.'
          : 'Esta categoría no tiene gastos asociados y se eliminará definitivamente.'}
        confirmLabel="Continuar"
        danger
        onCancel={() => setConfirmTarget(null)}
        onConfirm={handleConfirmDelete}
      />
      <ToastStack toasts={toasts} />
    </div>
  );
}
