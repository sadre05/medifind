import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useWebSocket } from '../hooks/useWebSocket'
import { shopAPI, requestAPI } from '../services/api'
import RequestCard from '../components/RequestCard'

export default function Dashboard() {
  const { shop, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [requests, setRequests] = useState([])
  const [history, setHistory] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [tab, setTab] = useState('requests') // 'requests' | 'history'
  const [togglingStatus, setTogglingStatus] = useState(false)
  const bellRef = useRef(false)

  // Stats
  const pending = requests.filter(r => !r._done)
  const confirmedToday = history.filter(h => h.response === 'confirmed').length

  async function loadProfile() {
    try {
      const { data } = await shopAPI.getProfile()
      setProfile(data)
    } catch {}
  }

  async function loadRequests() {
    try {
      const { data } = await requestAPI.getIncoming()
      setRequests(data)
    } catch {}
    setLoadingRequests(false)
  }

  async function loadHistory() {
    try {
      const { data } = await requestAPI.getHistory()
      setHistory(data)
    } catch {}
  }

  useEffect(() => {
    loadProfile()
    loadRequests()
    loadHistory()
    const interval = setInterval(loadRequests, 15000) // poll every 15s
    return () => clearInterval(interval)
  }, [])

  // WebSocket for real-time new requests
  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'NEW_REQUEST') {
      setRequests(prev => {
        if (prev.find(r => r.request_id === msg.request_id)) return prev
        return [{
          notification_id: `ws-${Date.now()}`,
          request_id: msg.request_id,
          request_code: msg.request_code,
          medicine_names: msg.medicine_names,
          distance_km: msg.distance_km,
          notified_at: new Date().toISOString(),
          _isNew: true,
        }, ...prev]
      })
    }
  }, [])

  useWebSocket(handleWsMessage)

  function handleRespond(notifId, response) {
    setRequests(prev => prev.map(r =>
      r.notification_id === notifId ? { ...r, _done: response } : r
    ))
    loadHistory()
  }

  async function toggleStatus() {
    setTogglingStatus(true)
    try {
      const { data } = await shopAPI.toggleStatus()
      setProfile(p => ({ ...p, is_open: data.is_open }))
    } catch {}
    setTogglingStatus(false)
  }

  const isOpen = profile?.is_open ?? false

  return (
    <div style={{ minHeight: '100vh', background: '#080E1C' }}>
      {/* Header */}
      <header style={{
        background: '#0D1628', borderBottom: '1px solid rgba(245,158,11,0.15)',
        padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div>
          <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: '#F59E0B' }}>
            <i className="ti ti-building-store" style={{ marginRight: 6 }} />
            {profile?.shop_name || shop?.name || 'Pharmacy'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Shop Owner Dashboard</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* GPS broadcasting badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)',
            borderRadius: 20, padding: '5px 12px', fontSize: 11, color: 'var(--green)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 1.2s infinite' }} />
            Broadcasting location
          </div>

          {/* Open/Close toggle */}
          <button
            onClick={toggleStatus}
            disabled={togglingStatus}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
              borderRadius: 20, padding: '7px 16px', cursor: 'pointer',
            }}
          >
            <div style={{
              width: 36, height: 20, borderRadius: 10,
              background: isOpen ? 'var(--green)' : 'var(--text3)',
              position: 'relative', transition: 'background 0.3s',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', width: 14, height: 14, borderRadius: '50%',
                background: '#fff', top: 3,
                left: isOpen ? 19 : 3,
                transition: 'left 0.3s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </div>
            <span style={{ fontSize: 12, color: isOpen ? 'var(--green)' : 'var(--text2)' }}>
              {isOpen ? 'Open' : 'Closed'}
            </span>
          </button>

          <button onClick={logout} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 8,
            padding: '6px 12px', color: 'var(--text2)', cursor: 'pointer', fontSize: 12,
          }}>
            <i className="ti ti-logout" />
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Pending Requests', val: pending.length, color: '#FBBF24' },
            { label: 'Confirmed Today', val: confirmedToday, color: 'var(--green)' },
            { label: 'Status', val: isOpen ? 'Open' : 'Closed', color: isOpen ? 'var(--green)' : 'var(--text3)' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '14px 16px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, color }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4 }}>
          {[
            { id: 'requests', label: 'Live Requests', icon: 'ti-bell' },
            { id: 'history', label: 'Response History', icon: 'ti-history' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '10px 0', border: 'none', borderRadius: 10, cursor: 'pointer',
              background: tab === t.id ? 'rgba(245,158,11,0.12)' : 'transparent',
              color: tab === t.id ? '#F59E0B' : 'var(--text2)',
              fontFamily: tab === t.id ? 'Syne' : 'DM Sans',
              fontWeight: tab === t.id ? 600 : 400,
              fontSize: 13, transition: 'all 0.2s',
            }}>
              <i className={`ti ${t.icon}`} style={{ marginRight: 6 }} />{t.label}
              {t.id === 'requests' && pending.length > 0 && (
                <span style={{
                  marginLeft: 8, background: 'var(--red)', color: '#fff',
                  fontSize: 10, padding: '1px 6px', borderRadius: 10,
                  animation: 'pulse 1.5s infinite',
                }}>
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Live Requests tab */}
        {tab === 'requests' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {!profile?.is_open && (
              <div style={{
                background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: 12, padding: '12px 16px', fontSize: 13, color: 'var(--yellow)',
                marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <i className="ti ti-alert-triangle" />
                Your shop is currently closed. Toggle Open to receive requests.
              </div>
            )}

            {loadingRequests ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 14 }}>
                <i className="ti ti-loader" style={{ fontSize: 24, display: 'block', marginBottom: 8 }} />
                Loading requests...
              </div>
            ) : pending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)', animation: 'fadeIn 0.5s ease' }}>
                <i className="ti ti-bell-off" style={{ fontSize: 44, display: 'block', marginBottom: 14, opacity: 0.3 }} />
                <p style={{ fontSize: 14, lineHeight: 1.8 }}>
                  No pending requests right now.<br />
                  You'll get notified instantly when users nearby search for medicine.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {requests.filter(r => !r._done).map(req => (
                  <RequestCard
                    key={req.notification_id || req.request_id}
                    req={{ ...req, shop_id: profile?.id }}
                    onRespond={handleRespond}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* History tab */}
        {tab === 'history' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)', fontSize: 14 }}>
                <i className="ti ti-history" style={{ fontSize: 44, display: 'block', marginBottom: 14, opacity: 0.3 }} />
                No responses yet
              </div>
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                borderRadius: 14, overflow: 'hidden',
              }}>
                {history.map((h, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 18px',
                    borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: h.response === 'confirmed' ? 'var(--green)' : h.response === 'declined' ? 'var(--red)' : 'var(--text3)',
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
                        {Array.isArray(h.medicine_names) ? h.medicine_names.join(', ') : h.medicine_names}
                      </div>
                      <div style={{ fontSize: 10, fontFamily: 'Syne', color: 'var(--text3)' }}>{h.request_code}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: 12, fontWeight: 500,
                        color: h.response === 'confirmed' ? 'var(--green)' : h.response === 'declined' ? 'var(--red)' : 'var(--text3)',
                        marginBottom: 2,
                      }}>
                        {h.response === 'confirmed' ? 'Confirmed' : h.response === 'declined' ? 'Declined' : 'Expired'}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                        {h.distance_km} km · {h.responded_at ? new Date(h.responded_at).toLocaleString() : '—'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
