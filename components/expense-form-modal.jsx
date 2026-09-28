'use client';

import { useState, useEffect } from 'react';
import { Icon } from './ui';
import { PAYMENT_METHODS } from '@/lib/constants';
import { todayISO, parseISO } from '@/lib/format';

export function ExpenseFormModal({ open, onClose, onSave, categories, initial, currency }) {
  const activeCats = categories.filter((c) => c.is_active !== false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setAmount(String((initial.amount_cents || 0) / 100));
      setDescription(initial.description || '');
      setCategoryId(initial.category_id || '');
      setDate(initial.date || todayISO());
      setPaymentMethod(initial.payment_method || '');
      setNotes(initial.notes || '');
    } else {
      setAmount('');
      setDescription('');
      setCategoryId(activeCats[0] ? activeCats[0].id : '');
      setDate(todayISO());
      setPaymentMethod('');
      setNotes('');
    }
    setErrors({});
  }, [open, initial]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  function validate() {
    const e = {};
    const amt = parseFloat(String(amount).replace(',', '.'));
    if (!amount || isNaN(amt) || amt <= 0) e.amount = 'Ingresá un monto mayor a cero.';
    if (!categoryId) e.categoryId = 'Elegí una categoría.';
    if (!date) e.date = 'Elegí una fecha.';
    else if (isNaN(parseISO(date).getTime())) e.date = 'La fecha no es válida.';
    if (description.length > 200) e.description = 'Máximo 200 caracteres.';
    if (notes.length > 500) e.notes = 'Máximo 500 caracteres.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        amount,
        description: description.trim(),
        categoryId,
        date,
        paymentMethod,
        notes: notes.trim(),
      }, initial ? initial.id : null);
      onClose();
    } catch (e) {
      setErrors({ amount: e.message || 'No pudimos guardar el gasto.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-sheet" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">{initial ? 'Editar gasto' : 'Agregar gasto'}</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        <div className="field">
          <label className="field-label">Monto</label>
          <div className="amount-input-wrap">
            <span className="cur-prefix">{currency}</span>
            <input className={'input' + (errors.amount ? ' has-error' : '')} type="number" inputMode="decimal" step="0.01" min="0"
              placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </div>
          {errors.amount && <div className="field-error">{errors.amount}</div>}
        </div>

        <div className="field">
          <label className="field-label">Categoría</label>
          <div className="cat-select-grid">
            {activeCats.map((c) => (
              <button key={c.id} type="button" className={'cat-select-opt' + (categoryId === c.id ? ' is-selected' : '')} onClick={() => setCategoryId(c.id)}>
                <span>{c.icon}</span><span>{c.name}</span>
              </button>
            ))}
          </div>
          {errors.categoryId && <div className="field-error">{errors.categoryId}</div>}
        </div>

        <div className="field-row">
          <div className="field">
            <label className="field-label">Fecha</label>
            <input className={'input' + (errors.date ? ' has-error' : '')} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            {errors.date && <div className="field-error">{errors.date}</div>}
          </div>
          <div className="field">
            <label className="field-label">Método de pago <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(opcional)</span></label>
            <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="">Sin especificar</option>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label className="field-label">Descripción <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(opcional)</span></label>
          <input className={'input' + (errors.description ? ' has-error' : '')} type="text" placeholder="Ej: Supermercado" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
          {errors.description && <div className="field-error">{errors.description}</div>}
        </div>

        <div className="field">
          <label className="field-label">Notas <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(opcional)</span></label>
          <textarea className={'input' + (errors.notes ? ' has-error' : '')} placeholder="Notas adicionales" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
          {errors.notes && <div className="field-error">{errors.notes}</div>}
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Guardando…' : 'Guardar gasto'}</button>
        </div>
      </div>
    </div>
  );
}
