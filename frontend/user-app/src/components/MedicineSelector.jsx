import React, { useState } from 'react'

/**
 * After prescription OCR, shows all extracted medicines.
 * User can: deselect, edit names, add new ones, then confirm selection.
 */
export default function MedicineSelector({ medicines, onConfirm, onCancel }) {
  const [items, setItems] = useState(
    medicines.map((m, i) => ({ id: i, name: m, selected: true, editing: false }))
  )
  const [newMed, setNewMed] = useState('')

  function toggle(id) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i))
  }

  function updateName(id, val) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, name: val } : i))
  }

  function setEditing(id, val) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, editing: val } : i))
  }

  function addMedicine() {
    const trimmed = newMed.trim()
    if (!trimmed) return
    setItems(prev => [...prev, { id: Date.now(), name: trimmed, selected: true, editing: false }])
    setNewMed('')
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const selected = items.filter(i => i.selected).map(i => i.name.trim()).filter(Boolean)

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border-blue)',
      borderRadius: 'var(--radius)',
      padding: 20,
      animation: 'fadeIn 0.4s ease'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(129,140,248,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--purple)', fontSize: 18
        }}>
          <i className="ti ti-file-text" />
        </div>
        <div>
          <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 15 }}>Prescription Scanned</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            {medicines.length} medicine{medicines.length !== 1 ? 's' : ''} found — select the ones you need
          </div>
        </div>
      </div>

      {/* Medicine list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {items.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: item.selected ? 'rgba(56,189,248,0.06)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${item.selected ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 10, padding: '10px 12px',
            transition: 'all 0.2s',
          }}>
            {/* Checkbox */}
            <div
              onClick={() => toggle(item.id)}
              style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0, cursor: 'pointer',
                background: item.selected ? 'var(--blue)' : 'transparent',
                border: `2px solid ${item.selected ? 'var(--blue)' : 'var(--text3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {item.selected && <i className="ti ti-check" style={{ fontSize: 11, color: '#0B0F1A' }} />}
            </div>

            {/* Name — editable */}
            {item.editing ? (
              <input
                autoFocus
                value={item.name}
                onChange={e => updateName(item.id, e.target.value)}
                onBlur={() => setEditing(item.id, false)}
                onKeyDown={e => e.key === 'Enter' && setEditing(item.id, false)}
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--border-blue)', borderRadius: 6,
                  padding: '4px 8px', color: 'var(--text)', fontSize: 14, outline: 'none'
                }}
              />
            ) : (
              <span style={{
                flex: 1, fontSize: 14,
                color: item.selected ? 'var(--text)' : 'var(--text3)',
                textDecoration: item.selected ? 'none' : 'line-through',
              }}>
                {item.name}
              </span>
            )}

            {/* Edit / Remove buttons */}
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setEditing(item.id, true)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text3)', fontSize: 14, padding: '2px 4px',
                  borderRadius: 4, transition: 'color 0.15s',
                }}
                onMouseOver={e => e.target.style.color = 'var(--blue)'}
                onMouseOut={e => e.target.style.color = 'var(--text3)'}
                title="Edit"
              >
                <i className="ti ti-pencil" />
              </button>
              <button
                onClick={() => removeItem(item.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text3)', fontSize: 14, padding: '2px 4px',
                  borderRadius: 4, transition: 'color 0.15s',
                }}
                onMouseOver={e => e.target.style.color = 'var(--red)'}
                onMouseOut={e => e.target.style.color = 'var(--text3)'}
                title="Remove"
              >
                <i className="ti ti-trash" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add custom medicine */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          className="input-field"
          placeholder="Add a medicine manually..."
          value={newMed}
          onChange={e => setNewMed(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addMedicine()}
          style={{ fontSize: 13, padding: '9px 12px' }}
        />
        <button
          onClick={addMedicine}
          style={{
            background: 'rgba(56,189,248,0.1)', border: '1px solid var(--border-blue)',
            borderRadius: 10, padding: '0 16px', color: 'var(--blue)',
            cursor: 'pointer', fontSize: 20, flexShrink: 0,
          }}
        >
          <i className="ti ti-plus" />
        </button>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)', borderRadius: 10,
            padding: '11px 0', color: 'var(--text2)', cursor: 'pointer', fontSize: 14,
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => selected.length > 0 && onConfirm(selected)}
          disabled={selected.length === 0}
          style={{
            flex: 2,
            background: selected.length > 0 ? 'linear-gradient(135deg,#0EA5E9,#6366F1)' : 'rgba(255,255,255,0.05)',
            border: 'none', borderRadius: 10, padding: '11px 0',
            color: selected.length > 0 ? '#fff' : 'var(--text3)',
            cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
            fontFamily: 'Syne', fontWeight: 600, fontSize: 14,
            transition: 'all 0.2s',
          }}
        >
          <i className="ti ti-search" style={{ marginRight: 6 }} />
          Search {selected.length} Medicine{selected.length !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  )
}
