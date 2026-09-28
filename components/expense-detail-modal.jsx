'use client';

import { useState } from 'react';
import { Icon, ConfirmModal } from './ui';
import { fmtMoney, fmtDateLong, fmtDateTime } from '@/lib/format';

export function ExpenseDetailModal({ open, onClose, expense, category, currency, onEdit, onDelete, authorName }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (!open || !expense) return null;
  return (
    <>
      <div className="modal-overlay" onMouseDown={onClose}>
        <div className="modal-sheet" onMouseDown={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <span className="cat-pill" style={{ background: (category ? category.color : '#999') + '22', color: category ? category.color : '#999' }}>
              {category ? category.icon : '❔'} {category ? category.name : 'Sin categoría'}
            </span>
            <button className="icon-btn" onClick={onClose}><Icon name="close" size={18} /></button>
          </div>
          <div className="detail-amount num">{fmtMoney(expense.amount_cents, currency)}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>{expense.description || 'Sin descripción'}</div>

          <div className="detail-grid">
            <div className="detail-item"><div className="dl">Fecha</div><div className="dv">{fmtDateLong(expense.date)}</div></div>
            <div className="detail-item"><div className="dl">Método de pago</div><div className="dv">{expense.payment_method || '—'}</div></div>
            <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
              <div className="dl">Notas</div>
              <div className="dv">{expense.notes || '—'}</div>
            </div>
          </div>

          <div className="detail-meta-line">
            <span>Cargado por {authorName || 'alguien'}</span>
            <span>Creado: {fmtDateTime(expense.created_at)}</span>
          </div>
          {expense.updated_at && expense.updated_at !== expense.created_at && (
            <div className="detail-meta-line" style={{ borderTop: 'none', marginTop: 4, paddingTop: 0 }}>
              <span>Última modificación: {fmtDateTime(expense.updated_at)}</span>
            </div>
          )}

          <div className="modal-actions">
            <button className="btn btn-danger" onClick={() => setConfirmOpen(true)}><Icon name="trash" size={15} /> Eliminar</button>
            <button className="btn btn-primary" onClick={() => onEdit(expense)}><Icon name="edit" size={15} /> Editar</button>
          </div>
        </div>
      </div>
      <ConfirmModal
        open={confirmOpen}
        title="¿Eliminar este gasto?"
        body="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); onDelete(expense); onClose(); }}
      />
    </>
  );
}
