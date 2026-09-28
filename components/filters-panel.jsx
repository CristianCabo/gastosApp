'use client';

import { PAYMENT_METHODS } from '@/lib/constants';

export const DEFAULT_FILTERS = { preset: 'all', from: '', to: '', categoryIds: [], amountMin: '', amountMax: '', paymentMethods: [], search: '' };

export function hasActiveFilters(f) {
  return f.preset !== 'all' || f.categoryIds.length || f.amountMin || f.amountMax || f.paymentMethods.length || f.search;
}

export function FiltersPanel({ filters, setFilters, categories }) {
  function toggleCat(id) {
    setFilters((f) => ({ ...f, categoryIds: f.categoryIds.includes(id) ? f.categoryIds.filter((x) => x !== id) : [...f.categoryIds, id] }));
  }
  function togglePm(pm) {
    setFilters((f) => ({ ...f, paymentMethods: f.paymentMethods.includes(pm) ? f.paymentMethods.filter((x) => x !== pm) : [...f.paymentMethods, pm] }));
  }
  return (
    <div className="filters-panel">
      <div className="field" style={{ marginBottom: 0 }}>
        <label className="field-label">Período</label>
        <select className="input" value={filters.preset} onChange={(e) => setFilters((f) => ({ ...f, preset: e.target.value }))}>
          <option value="all">Todos</option>
          <option value="today">Hoy</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
          <option value="lastMonth">Mes anterior</option>
          <option value="year">Este año</option>
          <option value="custom">Personalizado</option>
        </select>
        {filters.preset === 'custom' && (
          <div className="field-row" style={{ marginTop: 8 }}>
            <input className="input" type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
            <input className="input" type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
          </div>
        )}
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label className="field-label">Monto</label>
        <div className="field-row">
          <input className="input" type="number" placeholder="Mínimo" value={filters.amountMin} onChange={(e) => setFilters((f) => ({ ...f, amountMin: e.target.value }))} />
          <input className="input" type="number" placeholder="Máximo" value={filters.amountMax} onChange={(e) => setFilters((f) => ({ ...f, amountMax: e.target.value }))} />
        </div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label className="field-label">Método de pago</label>
        <div className="cat-check-grid">
          {PAYMENT_METHODS.map((pm) => (
            <button key={pm} className={'cat-check' + (filters.paymentMethods.includes(pm) ? ' is-on' : '')}
              style={filters.paymentMethods.includes(pm) ? { background: 'var(--primary-soft)', color: 'var(--primary-strong)' } : {}}
              onClick={() => togglePm(pm)}>{pm}</button>
          ))}
        </div>
      </div>
      <div className="field" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
        <label className="field-label">Categorías</label>
        <div className="cat-check-grid">
          {categories.map((c) => (
            <button key={c.id} className={'cat-check' + (filters.categoryIds.includes(c.id) ? ' is-on' : '')}
              style={filters.categoryIds.includes(c.id) ? { background: c.color + '22', color: c.color, borderColor: c.color + '55' } : {}}
              onClick={() => toggleCat(c.id)}>
              <span className="cat-dot" style={{ background: c.color }} /> {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
