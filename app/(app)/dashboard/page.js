'use client';

import { useState, useEffect, useMemo } from 'react';
import { Icon, DonutChart, BarChart, useToasts, ToastStack } from '@/components/ui';
import { useAppData } from '@/lib/use-app-data';
import { ExpenseFormModal } from '@/components/expense-form-modal';
import { periodRange, todayISO, startOfMonth, fmtMoney, addDays, parseISO } from '@/lib/format';

export default function DashboardPage() {
  const { profile, categories, loading, reloadCategories } = useAppData();
  const currency = profile?.currency || 'ARS';
  const [period, setPeriod] = useState('month');
  const [custom, setCustom] = useState({ from: startOfMonth(todayISO()), to: todayISO() });
  const [summary, setSummary] = useState(null);
  const [catData, setCatData] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [toasts, toast] = useToasts();

  const range = periodRange(period, custom);
  const span = (parseISO(range.to) - parseISO(range.from)) / 86400000;
  const group = span > 62 ? 'month' : 'day';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const qs = `from=${range.from}&to=${range.to}`;
      const [s, c, t] = await Promise.all([
        fetch(`/api/statistics?type=summary&${qs}`).then((r) => r.json()),
        fetch(`/api/statistics?type=categories&${qs}`).then((r) => r.json()),
        fetch(`/api/statistics?type=timeline&${qs}&group=${group}`).then((r) => r.json()),
      ]);
      if (cancelled) return;
      setSummary(s);
      setCatData(c.data || []);
      setTimeline(t.data || []);
    })();
    return () => { cancelled = true; };
  }, [range.from, range.to, group]);

  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const topCat = summary && summary.topCategoryId ? catMap[summary.topCategoryId] : null;

  const segments = catData.map((x) => {
    const c = catMap[x.categoryId];
    return { color: c ? c.color : '#999', value: x.total, name: c ? c.name : 'Otros', icon: c ? c.icon : '❔' };
  });
  const points = timeline.map((p) => ({ label: group === 'month' ? p.key.slice(5) : p.key.slice(8), value: p.total }));

  async function handleSaveExpense(data, id) {
    const res = await fetch(id ? `/api/expenses/${id}` : '/api/expenses', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    toast('Gasto agregado.');
    setPeriod((p) => p); // fuerza el refetch de estadísticas
  }

  if (loading) {
    return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Cargando…</div>;
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Resumen</h1>
          <p className="page-sub">Vista general de tus gastos compartidos.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setFormOpen(true)}><Icon name="plus" size={16} /> Agregar gasto</button>
      </div>

      <div className="period-bar">
        {[['today', 'Hoy'], ['week', 'Esta semana'], ['month', 'Este mes'], ['lastMonth', 'Mes anterior'], ['year', 'Este año'], ['custom', 'Personalizado']].map(([k, label]) => (
          <button key={k} className={'chip-toggle' + (period === k ? ' is-active' : '')} onClick={() => setPeriod(k)}>{label}</button>
        ))}
      </div>
      {period === 'custom' && (
        <div className="field-row" style={{ maxWidth: 360, marginBottom: 18 }}>
          <div className="field"><label className="field-label">Desde</label><input className="input" type="date" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} /></div>
          <div className="field"><label className="field-label">Hasta</label><input className="input" type="date" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} /></div>
        </div>
      )}

      <div className="grid-stats">
        <div className="card stat-card"><span className="stat-label">Total gastado</span><span className="stat-value num">{fmtMoney(summary?.total, currency)}</span></div>
        <div className="card stat-card"><span className="stat-label">Gastos registrados</span><span className="stat-value num">{summary?.count ?? 0}</span></div>
        <div className="card stat-card"><span className="stat-label">Gasto promedio</span><span className="stat-value num small">{fmtMoney(summary?.average, currency)}</span></div>
        <div className="card stat-card">
          <span className="stat-label">Categoría con mayor gasto</span>
          {topCat ? (
            <>
              <span className="stat-value small">{topCat.icon} {topCat.name}</span>
              <span className="stat-sub num">{fmtMoney(summary.topCategoryTotal, currency)}</span>
            </>
          ) : <span className="stat-value small" style={{ color: 'var(--text-faint)' }}>—</span>}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="section-title">Evolución de gastos</h3>
          {points.length ? <BarChart points={points} currency={currency} /> : (
            <div className="empty-state" style={{ padding: '30px 10px' }}><div className="em-icon">📉</div><div className="em-title">Sin datos en este período</div></div>
          )}
        </div>
        <div className="card">
          <h3 className="section-title">Por categoría</h3>
          {segments.length ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <DonutChart segments={segments} size={140} />
              <div className="legend" style={{ flex: 1, minWidth: 140 }}>
                {segments.slice(0, 6).map((s, i) => (
                  <div className="legend-row" key={i}>
                    <span className="cat-dot" style={{ background: s.color }} />
                    <span className="legend-name">{s.icon} {s.name}</span>
                    <span className="legend-pct">{summary?.total ? Math.round((s.value / summary.total) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px 10px' }}><div className="em-icon">🗂️</div><div className="em-title">Todavía no hay gastos</div><div className="em-sub">Agregá tu primer gasto para ver el resumen.</div></div>
          )}
        </div>
      </div>

      <ExpenseFormModal open={formOpen} categories={categories} currency={currency} initial={null} onClose={() => setFormOpen(false)} onSave={handleSaveExpense} />
      <ToastStack toasts={toasts} />
    </div>
  );
}
