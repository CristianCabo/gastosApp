'use client';

import { useState, useEffect } from 'react';
import { Icon } from './ui';
import { ICON_CHOICES, COLOR_CHOICES } from '@/lib/constants';

export function CategoryFormModal({ open, onClose, onSave, initial }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_CHOICES[0]);
  const [icon, setIcon] = useState(ICON_CHOICES[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initial ? initial.name : '');
    setColor(initial ? initial.color : COLOR_CHOICES[Math.floor(Math.random() * COLOR_CHOICES.length)]);
    setIcon(initial ? initial.icon : ICON_CHOICES[Math.floor(Math.random() * ICON_CHOICES.length)]);
    setError('');
  }, [open, initial]);

  if (!open) return null;

  function handleSubmit() {
    if (!name.trim()) { setError('Ingresá un nombre para la categoría.'); return; }
    onSave({ name: name.trim(), color, icon }, initial ? initial.id : null);
    onClose();
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-sheet" style={{ maxWidth: 420 }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">{initial ? 'Editar categoría' : 'Nueva categoría'}</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="field">
          <label className="field-label">Nombre</label>
          <input className={'input' + (error ? ' has-error' : '')} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Mascotas" maxLength={40} autoFocus />
          {error && <div className="field-error">{error}</div>}
        </div>
        <div className="field">
          <label className="field-label">Icono</label>
          <div className="cat-select-grid">
            {ICON_CHOICES.map((ic) => (
              <button key={ic} type="button" className={'cat-select-opt' + (icon === ic ? ' is-selected' : '')} onClick={() => setIcon(ic)} style={{ fontSize: 16 }}>{ic}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="field-label">Color</label>
          <div className="cat-select-grid">
            {COLOR_CHOICES.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: color === c ? '3px solid var(--text)' : '1px solid var(--border)' }} />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
