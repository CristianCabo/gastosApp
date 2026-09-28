'use client';

import { useState, useCallback } from 'react';
import { fmtMoney } from '@/lib/format';

export function Icon({ name, size = 18 }) {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    dashboard: <><rect x="3" y="3" width="8" height="9" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="14" width="8" height="7" rx="2"/></>,
    expenses: <path d="M4 6h16M4 12h16M4 18h10"/>,
    categories: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    stats: <path d="M4 20V10M12 20V4M20 20v-7"/>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.96 19.6a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.96a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.04Z"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></>,
    trash: <><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
    filter: <path d="M4 5h16M7 12h10M11 19h2"/>,
    x: <path d="M18 6L6 18M6 6l12 12"/>,
    download: <><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></>,
    close: <path d="M18 6L6 18M6 6l12 12"/>,
    check: <path d="M20 6L9 17l-5-5"/>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>,
    users: <><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6"/><circle cx="18" cy="9" r="2.8"/><path d="M15.5 20c.3-2.6 2.3-4.5 4.9-4.9"/></>,
  };
  return <svg {...s}>{paths[name] || null}</svg>;
}

export function ConfirmModal({ open, title, body, confirmLabel, danger, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <div className="modal-sheet" style={{ maxWidth: 380 }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head"><h3 className="modal-title">{title}</h3></div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>{body}</p>
        <div className="modal-actions">
          <button className="btn" onClick={onCancel}>Cancelar</button>
          <button className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>{confirmLabel || 'Confirmar'}</button>
        </div>
      </div>
    </div>
  );
}

export function DonutChart({ segments, size = 168 }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = size / 2 - 14;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  if (total <= 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="18" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {segments.map((seg, i) => {
        const frac = seg.value / total;
        const dash = frac * circumference;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="18"
            strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={-offset}
            strokeLinecap={segments.length > 1 ? 'butt' : 'round'} />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

export function BarChart({ points, height = 180, currency }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...points.map((p) => p.value));
  const w = Math.max(320, points.length * 46);
  const barW = Math.min(34, w / Math.max(points.length, 1) - 10);
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={w} height={height + 34} viewBox={`0 0 ${w} ${height + 34}`}>
        {points.map((p, i) => {
          const bh = max > 0 ? (p.value / max) * (height - 10) : 0;
          const x = i * (w / points.length) + (w / points.length - barW) / 2;
          const y = height - bh;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={x} y={y} width={barW} height={Math.max(bh, 2)} rx={4} fill={hover === i ? 'var(--accent)' : 'var(--primary)'} />
              <text x={x + barW / 2} y={height + 18} textAnchor="middle" fontSize="10.5" fill="var(--text-faint)" fontFamily="var(--font-body)">{p.label}</text>
              {hover === i && (
                <text x={x + barW / 2} y={y - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text)" fontFamily="var(--font-mono)">
                  {fmtMoney(p.value, currency)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type) => {
    const id = 't_' + Date.now() + Math.random().toString(36).slice(2, 6);
    setToasts((cur) => [...cur, { id, msg, type: type || 'ok' }]);
    setTimeout(() => setToasts((cur) => cur.filter((t) => t.id !== id)), 2600);
  }, []);
  return [toasts, push];
}

export function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={'toast' + (t.type === 'error' ? ' is-error' : '')}>
          {t.type === 'error' ? <Icon name="x" size={14} /> : <Icon name="check" size={14} />} {t.msg}
        </div>
      ))}
    </div>
  );
}
