'use client';

import { useState, useEffect, useMemo } from 'react';
import { DonutChart, BarChart } from '@/components/ui';
import { useAppData } from '@/lib/use-app-data';
import {
  periodRange, todayISO, fmtMoney,
  startOfMonth, endOfMonth, startOfLastMonth, endOfLastMonth,
  startOfYear, endOfYear, parseISO, toISODate,
} from '@/lib/format';

export default function StatsPage() {
  const { profile, categories, loading } = useAppData();
  const currency = profile?.currency || 'ARS';
  const [period, setPeriod] = useState('month');
  const [custom, setCustom] = useState({ from: startOfMonth(todayISO()), to: todayISO() });
  const [group, setGroup] = useState('day');
  const [catData, setCatData] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [compareData, setCompareData] = useState(null);

  const range = periodRange(period, custom);
  const total = catData.reduce((s, x) => s + x.total, 0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const qs = `from=${range.from}&to=${range.to}`;
      const [c, t] = await Promise.all([
        fetch(`/api/statistics?type=categories&${qs}`).then((r) => r.json()),
        fetch(`/api/statistics?type=timeline&${qs}&group=${group}`).then((r) => r.json()),
      ]);
      if (cancelled) return;
      setCatData(c.data || []);
      setTimeline(t.data || []);
    })();
    return () => { cancelled = true; };
  }, [range.from, range.to, group]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const t = todayISO();
      const curMonth = { from: startOfMonth(t), to: endOfMonth(t) };
      const prevMonth = { from: startOfLastMonth(t), to: endOfLastMonth(t) };
      const curYear = { from: startOfYear(t), to: endOfYear(t) };
      const y = parseISO(t).getFullYear();
      const prevYear = { from: toISODate(new Date(y - 1, 0, 1)), to: toISODate(new Date(y - 1, 11, 31)) };

      const sumRange = async (r) => {
        const j = await fetch(`/api/statistics?type=summary&from=${r.from}&to=${r.to}`).then((res) => res.json());
        return j.total || 0;
      };
      const [cm, pm, cy, py] = await Promise.all([sumRange(curMonth), sumRange(prevMonth), sumRange(curYear), sumRange(prevYear)]);
      if (cancelled) return;
      setCompareData({ curMonth: cm, prevMonth: pm, curYear: cy, prevYear: py });
    })();
    return () => { cancelled = true; };
  }, []);

  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const segments = catData.map((x) => {
    const c = catMap[x.categoryId];
    return { color: c ? c.color : '#999', value: x.total, name: c ? c.name : 'Otros', icon: c ? c.icon : '❔' };
  });
  const points = timeline.map((p) => ({
    label: group === 'month' ? p.key.slice(5) : group === 'week' ? p.key.slice(5) : p.key.slice(8),
    value: p.total,
  }));

  function Comparison({ label, a, b }) {
    const diff = a - b;
    const pct = b !== 0 ? (diff / b) * 100 : (a > 0 ? 100 : 0);
    return (
      <div className="card compare-card">
        <span className="stat-label">{label}</span>
        <div style={{ display: 'flex', gap: 18, marginTop: 8, flexWrap: 'wrap' }}>
          <div><div className="stat-sub">Actual</div><div className="stat-value small num">{fmtMoney(a, currency)}</div></div>
          <div><div className="stat-sub">Anterior</div><div className="stat-value small num">{fmtMoney(b, currency)}</div></div>
        </div>
        <div className="compare-diff">
          <span>{diff === 0 ? '→' : diff > 0 ? '▲' : '▼'}</span>
          <span className="compare-pct num">{fmtMoney(Math.abs(diff), currency)} ({Math.abs(pct).toFixed(1)}%)</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Estadísticas</h1>
          <p className="page-sub">Analizá cómo se distribuyen tus gastos.</p>
        </div>
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

      <div className="grid-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 className="section-title" style={{ margin: 0 }}>Evolución temporal</h3>
            <div className="group-toggle">
              <button className={group === 'day' ? 'is-active' : ''} onClick={() => setGroup('day')}>Día</button>
              <button className={group === 'week' ? 'is-active' : ''} onClick={() => setGroup('week')}>Semana</button>
              <button className={group === 'month' ? 'is-active' : ''} onClick={() => setGroup('month')}>Mes</button>
            </div>
          </div>
          {points.length ? <BarChart points={points} currency={currency} /> : (
            <div className="empty-state" style={{ padding: '30px 10px' }}><div className="em-icon">📉</div><div className="em-title">Sin datos</div></div>
          )}
        </div>
        <div className="card">
          <h3 className="section-title">Gastos por categoría</h3>
          {segments.length ? (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <DonutChart segments={segments} size={140} />
              <div className="legend" style={{ flex: 1, minWidth: 140 }}>
                {segments.map((s, i) => (
                  <div className="legend-row" key={i}>
                    <span className="cat-dot" style={{ background: s.color }} />
                    <span className="legend-name">{s.icon} {s.name}</span>
                    <span className="legend-pct">{total ? Math.round((s.value / total) * 100) : 0}%</span>
                    <span className="legend-amt num">{fmtMoney(s.value, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="empty-state" style={{ padding: '30px 10px' }}><div className="em-icon">🗂️</div><div className="em-title">Sin datos</div></div>}
        </div>
      </div>

      <h3 className="section-title">Comparaciones</h3>
      {compareData && (
        <div className="compare-grid">
          <Comparison label="Mes actual vs. mes anterior" a={compareData.curMonth} b={compareData.prevMonth} />
          <Comparison label="Año actual vs. año anterior" a={compareData.curYear} b={compareData.prevYear} />
        </div>
      )}
    </div>
  );
}
