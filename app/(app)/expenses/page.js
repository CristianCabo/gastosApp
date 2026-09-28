'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Icon, useToasts, ToastStack } from '@/components/ui';
import { useAppData } from '@/lib/use-app-data';
import { ExpenseFormModal } from '@/components/expense-form-modal';
import { ExpenseDetailModal } from '@/components/expense-detail-modal';
import { FiltersPanel, DEFAULT_FILTERS, hasActiveFilters } from '@/components/filters-panel';
import { fmtMoney, fmtDateShort } from '@/lib/format';

export default function ExpensesPage() {
  const { profile, categories, loading: dataLoading } = useAppData();
  const currency = profile?.currency || 'ARS';
  const searchParams = useSearchParams();
  const router = useRouter();

  const [expenses, setExpenses] = useState([]);
  const [expLoading, setExpLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('date_desc');

  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [detailExpense, setDetailExpense] = useState(null);
  const [toasts, toast] = useToasts();

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setEditingExpense(null);
      setFormOpen(true);
      router.replace('/expenses');
    }
  }, [searchParams, router]);

  const load = useCallback(async () => {
    setExpLoading(true);
    const p = new URLSearchParams();
    if (filters.preset !== 'all') {
      if (filters.preset === 'custom') {
        if (filters.from) p.set('from', filters.from);
        if (filters.to) p.set('to', filters.to);
      } else {
        p.set('preset', filters.preset);
      }
    }
    if (filters.categoryIds.length) p.set('category', filters.categoryIds.join(','));
    if (filters.amountMin) p.set('minAmount', filters.amountMin);
    if (filters.amountMax) p.set('maxAmount', filters.amountMax);
    if (filters.paymentMethods.length) p.set('paymentMethod', filters.paymentMethods.join(','));
    if (filters.search) p.set('search', filters.search);
    p.set('sort', sortBy);
    p.set('pageSize', '200');

    // El preset de período (hoy/semana/mes/...) se resuelve en el cliente
    // porque depende de la fecha de "hoy" del usuario.
    if (filters.preset !== 'all' && filters.preset !== 'custom') {
      const { periodRange, todayISO } = await import('@/lib/format');
      const r = periodRange(filters.preset, filters);
      p.set('from', r.from);
      p.set('to', r.to);
      p.delete('preset');
    }

    const res = await fetch(`/api/expenses?${p.toString()}`);
    const json = await res.json();
    setExpenses(json.data || []);
    setExpLoading(false);
  }, [filters, sortBy]);

  useEffect(() => { load(); }, [load]);

  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  async function handleSaveExpense(data, id) {
    const res = await fetch(id ? `/api/expenses/${id}` : '/api/expenses', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    toast(id ? 'Gasto actualizado.' : 'Gasto agregado.');
    load();
  }

  async function handleDeleteExpense(exp) {
    const res = await fetch(`/api/expenses/${exp.id}`, { method: 'DELETE' });
    if (res.ok) { toast('Gasto eliminado.'); load(); } else { toast('No pudimos eliminar el gasto.', 'error'); }
  }

  function exportCsv() {
    const rows = [['Fecha', 'Descripción', 'Categoría', 'Método de pago', 'Monto', 'Notas']];
    expenses.forEach((e) => {
      const c = catMap[e.category_id];
      rows.push([e.date, e.description || '', c ? c.name : '', e.payment_method || '', (e.amount_cents / 100).toFixed(2), e.notes || '']);
    });
    const csv = rows.map((r) => r.map(csvEscape).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'gastos.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const loading = dataLoading || expLoading;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Gastos</h1>
          <p className="page-sub">{loading ? 'Cargando…' : `${expenses.length} ${expenses.length === 1 ? 'gasto encontrado' : 'gastos encontrados'}`}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={exportCsv}><Icon name="download" size={15} /> Exportar CSV</button>
          <button className="btn btn-primary" onClick={() => { setEditingExpense(null); setFormOpen(true); }}><Icon name="plus" size={16} /> Agregar</button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <Icon name="search" size={16} />
          <input className="input" placeholder="Buscar por descripción, nota o categoría…" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
        </div>
        <button className={'btn' + (showFilters ? ' btn-primary' : '')} onClick={() => setShowFilters((s) => !s)}><Icon name="filter" size={15} /> Filtros</button>
        <select className="input" style={{ width: 'auto' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date_desc">Más recientes</option>
          <option value="date_asc">Más antiguos</option>
          <option value="amount_desc">Monto: mayor a menor</option>
          <option value="amount_asc">Monto: menor a mayor</option>
        </select>
        {hasActiveFilters(filters) && <button className="btn btn-ghost" onClick={() => setFilters(DEFAULT_FILTERS)}><Icon name="x" size={14} /> Limpiar filtros</button>}
      </div>

      {showFilters && <FiltersPanel filters={filters} setFilters={setFilters} categories={categories} />}

      {!loading && expenses.length === 0 ? (
        <div className="empty-state">
          <div className="em-icon">🧾</div>
          <div className="em-title">{hasActiveFilters(filters) ? 'No hay gastos con estos filtros' : 'Todavía no tenés gastos registrados'}</div>
          <div className="em-sub">{hasActiveFilters(filters) ? 'Probá ajustar o limpiar los filtros.' : 'Agregá tu primer gasto para comenzar.'}</div>
        </div>
      ) : (
        <>
          <table className="expense-table">
            <thead><tr><th>Fecha</th><th>Descripción</th><th>Categoría</th><th>Método de pago</th><th className="num-col">Monto</th><th></th></tr></thead>
            <tbody>
              {expenses.map((e) => {
                const c = catMap[e.category_id];
                return (
                  <tr className="expense-row" key={e.id} onClick={() => setDetailExpense(e)}>
                    <td className="date-cell">{fmtDateShort(e.date)}</td>
                    <td>
                      <div className="expense-desc">{e.description || 'Sin descripción'}</div>
                      {e.notes && <div className="expense-notes-hint">{e.notes.length > 46 ? e.notes.slice(0, 46) + '…' : e.notes}</div>}
                    </td>
                    <td><span className="cat-pill" style={{ background: (c ? c.color : '#999') + '22', color: c ? c.color : '#999' }}>{c ? c.icon : '❔'} {c ? c.name : '—'}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{e.payment_method || '—'}</td>
                    <td className="num-col">{fmtMoney(e.amount_cents, currency)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={(ev) => { ev.stopPropagation(); setEditingExpense(e); setFormOpen(true); }}><Icon name="edit" size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="expense-cards">
            {expenses.map((e) => {
              const c = catMap[e.category_id];
              return (
                <div className="expense-card-row" key={e.id} onClick={() => setDetailExpense(e)}>
                  <div className="expense-card-icon" style={{ background: (c ? c.color : '#999') + '22' }}>{c ? c.icon : '❔'}</div>
                  <div className="expense-card-body">
                    <div className="expense-card-title">{e.description || (c ? c.name : 'Gasto')}</div>
                    <div className="expense-card-meta">{fmtDateShort(e.date)} · {c ? c.name : '—'}</div>
                  </div>
                  <div className="expense-card-amount num">{fmtMoney(e.amount_cents, currency)}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <ExpenseFormModal open={formOpen} categories={categories} currency={currency} initial={editingExpense}
        onClose={() => setFormOpen(false)} onSave={handleSaveExpense} />
      <ExpenseDetailModal open={!!detailExpense} expense={detailExpense} category={detailExpense ? catMap[detailExpense.category_id] : null}
        currency={currency} authorName={profile?.name || 'alguien'}
        onClose={() => setDetailExpense(null)}
        onEdit={(exp) => { setDetailExpense(null); setEditingExpense(exp); setFormOpen(true); }}
        onDelete={handleDeleteExpense} />
      <ToastStack toasts={toasts} />
    </div>
  );
}

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
