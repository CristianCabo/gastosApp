import { CURRENCIES } from './constants';

export function pad2(n) {
  return String(n).padStart(2, '0');
}
export function toISODate(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
export function todayISO() {
  return toISODate(new Date());
}
export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}
export function startOfWeek(iso) {
  const d = parseISO(iso);
  const day = (d.getDay() + 6) % 7; // lunes = 0
  d.setDate(d.getDate() - day);
  return toISODate(d);
}
export function endOfWeek(iso) {
  return addDays(startOfWeek(iso), 6);
}
export function startOfMonth(iso) {
  const d = parseISO(iso);
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
}
export function endOfMonth(iso) {
  const d = parseISO(iso);
  return toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}
export function startOfLastMonth(iso) {
  const d = parseISO(iso);
  return toISODate(new Date(d.getFullYear(), d.getMonth() - 1, 1));
}
export function endOfLastMonth(iso) {
  const d = parseISO(iso);
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 0));
}
export function startOfYear(iso) {
  const d = parseISO(iso);
  return toISODate(new Date(d.getFullYear(), 0, 1));
}
export function endOfYear(iso) {
  const d = parseISO(iso);
  return toISODate(new Date(d.getFullYear(), 11, 31));
}

export function periodRange(preset, custom) {
  const t = todayISO();
  switch (preset) {
    case 'today': return { from: t, to: t };
    case 'week': return { from: startOfWeek(t), to: endOfWeek(t) };
    case 'month': return { from: startOfMonth(t), to: endOfMonth(t) };
    case 'lastMonth': return { from: startOfLastMonth(t), to: endOfLastMonth(t) };
    case 'year': return { from: startOfYear(t), to: endOfYear(t) };
    case 'custom': return { from: (custom && custom.from) || t, to: (custom && custom.to) || t };
    default: return { from: '0001-01-01', to: '9999-12-31' };
  }
}

export function fmtMoney(cents, currency) {
  const conf = CURRENCIES[currency] || CURRENCIES.ARS;
  try {
    return new Intl.NumberFormat(conf.locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format((cents || 0) / 100);
  } catch (e) {
    return '$' + ((cents || 0) / 100).toFixed(0);
  }
}
export function fmtDateShort(iso) {
  const d = parseISO(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).replace('.', '');
}
export function fmtDateLong(iso) {
  const d = parseISO(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
}
export function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  );
}
