import React, { useState } from 'react'
import { requestAPI } from '../services/api'

export default function RequestCard({ req, onRespond }) {
  const [loading, setLoading] = useState(null) // 'confirmed' | 'declined'
  const [done, setDone] = useState(null)

  async function respond(response) {
    setLoading(response)
    try {
      await requestAPI.respond(req.request_id, req.shop_id, response)
      setDone(response)
      onRespond(req.notification_id, response)
    } catch (e) {
      alert(e.response?.data?.detail || 'Error responding')
    } finally {
      setLoading(null)
    }
  }

  const meds = Array.isArray(req.medicine_names) ? req.medicine_names : []

  return (
    <div style={{
      background: done === 'confirmed'
        ? 'rgba(74,222,128,0.05)'
        : done === 'declined'
        ? 'rgba(248,113,113,0.04)'
        : 'rgba(255,255,255,0.02)',
      border: `1px solid ${done === 'confirmed' ? 'rgba(74,222,128,0.25)' : done === 'declined' ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 14, padding: '16px 18px',
      animation: 'slideIn 0.4s ease',
      transition: 'all 0.3s',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontSize: 10, fontFamily: 'Syne', fontWeight: 600,
          color: '#F59E0B', background: 'rgba(245,158,11,0.1)',
          padding: '2px 8px', borderRadius: 6, letterSpacing: 0.5,
        }}>
          {req.request_code}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>
          {new Date(req.notified_at).toLocaleTimeString()}
        </span>
      </div>

      {/* Medicines */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>Requested medicines:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {meds.map((m, i) => (
            <span key={i} style={{
              background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.18)',
              color: 'var(--blue)', borderRadius: 8, padding: '3px 10px', fontSize: 12,
            }}>
              <i className="ti ti-pill" style={{ fontSize: 10, marginRight: 4 }} />{m}
            </span>
          ))}
        </div>
      </div>

      {/* Distance */}
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>
        <i className="ti ti-map-pin" style={{ marginRight: 4, fontSize: 11 }} />
        User is {req.distance_km} km away
      </div>

      {/* Action buttons or done state */}
      {!done ? (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => respond('confirmed')}
            disabled={!!loading}
            style={{
              flex: 1, background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.3)', borderRadius: 10,
              padding: '10px 0', color: 'var(--green)', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
              opacity: loading && loading !== 'confirmed' ? 0.5 : 1,
            }}
            onMouseOver={e => !loading && (e.currentTarget.style.background = 'rgba(74,222,128,0.2)')}
            onMouseOut={e => (e.currentTarget.style.background = 'rgba(74,222,128,0.1)')}
          >
            <i className="ti ti-check" style={{ marginRight: 6 }} />
            {loading === 'confirmed' ? 'Confirming...' : 'Confirm Stock'}
          </button>
          <button
            onClick={() => respond('declined')}
            disabled={!!loading}
            style={{
              flex: 1, background: 'rgba(248,113,113,0.07)',
              border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10,
              padding: '10px 0', color: 'var(--red)', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
              opacity: loading && loading !== 'declined' ? 0.5 : 1,
            }}
            onMouseOver={e => !loading && (e.currentTarget.style.background = 'rgba(248,113,113,0.15)')}
            onMouseOut={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.07)')}
          >
            <i className="ti ti-x" style={{ marginRight: 6 }} />
            {loading === 'declined' ? 'Declining...' : 'Not Available'}
          </button>
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '10px 0', fontSize: 13,
          color: done === 'confirmed' ? 'var(--green)' : 'var(--red)',
        }}>
          <i className={`ti ti-${done === 'confirmed' ? 'check-circle' : 'circle-x'}`} style={{ marginRight: 6 }} />
          {done === 'confirmed' ? 'Confirmed — user notified!' : 'Declined'}
        </div>
      )}
    </div>
  )
}
