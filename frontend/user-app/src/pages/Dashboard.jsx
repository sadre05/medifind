import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useGPS } from '../hooks/useGPS'
import { useWebSocket } from '../hooks/useWebSocket'
import { requestAPI, prescriptionAPI } from '../services/api'
import MedicineSelector from '../components/MedicineSelector'
import NotificationCard from '../components/NotificationCard'

const QUICK = ['Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Metformin', 'Cetirizine', 'Vitamin D3']
const WAIT_SECONDS = 60

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { location, error: gpsError, loading: gpsLoading, requestLocation } = useGPS()

  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [activeRequest, setActiveRequest] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [newNotifIds, setNewNotifIds] = useState(new Set())
  const [prescLoading, setPrescLoading] = useState(false)
  const [prescMedicines, setPrescMedicines] = useState(null)
  const [showSelector, setShowSelector] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(null)
  const fileRef = useRef()
  const timerRef = useRef(null)
  const intervalRef = useRef(null)

  function startTimer() {
    setTimer(WAIT_SECONDS)
    clearInterval(intervalRef.current)
    clearTimeout(timerRef.current)

    intervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current)
      setTimer(0)
      setActiveRequest(r => r ? { ...r, status: 'closed' } : r)
    }, WAIT_SECONDS * 1000)
  }

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current)
      clearTimeout(timerRef.current)
    }
  }, [])

  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'SHOP_CONFIRMED') {
      clearInterval(intervalRef.current)
      clearTimeout(timerRef.current)
      setTimer(null)
      const notif = { ...msg, id: Date.now() }
      setNotifications(prev => {
        const updated = [notif, ...prev]
        return updated.sort((a, b) => (a.shop?.distance_km || 0) - (b.shop?.distance_km || 0))
      })
      setNewNotifIds(prev => new Set([...prev, notif.id]))
      setTimeout(() => setNewNotifIds(prev => {
        const next = new Set(prev); next.delete(notif.id); return next
      }), 5000)
    }
  }, [])

  useWebSocket(handleWsMessage)

  async function startSearch(medicines) {
    if (!location) { setError('Please enable GPS first'); return }
    setError('')
    setSearching(true)
    setShowSelector(false)
    setPrescMedicines(null)
    clearInterval(intervalRef.current)
    clearTimeout(timerRef.current)
    setTimer(null)
    try {
      const { data } = await requestAPI.create({
        medicine_names: medicines,
        latitude: location.latitude,
        longitude: location.longitude,
      })
      setActiveRequest(data)
      setNotifications([])
      startTimer()
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  function handleSearchSubmit(e) {
    e?.preventDefault()
    const trimmed = search.trim()
    if (!trimmed) return
    startSearch([trimmed])
  }

  async function handlePrescriptionUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPrescLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await prescriptionAPI.upload(fd)
      if (data.extracted_medicines?.length > 0) {
        setPrescMedicines(data.extracted_medicines)
        setShowSelector(true)
      } else {
        setError('No medicines detected in prescription. Please type them manually.')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed')
    } finally {
      setPrescLoading(false)
      e.target.value = ''
    }
  }

  const gpsActive = !!location

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{
          fontFamily: 'Syne', fontWeight: 700, fontSize: 20,
          background: 'linear-gradient(90deg,#38BDF8,#818CF8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          <i className="ti ti-pill" style={{ marginRight: 6 }} />MediFind
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={requestLocation}
            disabled={gpsLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: gpsActive ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.1)',
              border: `1px solid ${gpsActive ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}`,
              borderRadius: 20, padding: '6px 14px', cursor: 'pointer',
              color: gpsActive ? 'var(--green)' : 'var(--yellow)', fontSize: 12,
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: gpsActive ? 'var(--green)' : 'var(--yellow)',
              animation: 'pulse 1.2s infinite',
            }} />
            {gpsLoading ? 'Getting location...' : gpsActive ? 'GPS Active' : 'Enable GPS'}
          </button>

          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Hi, {user?.name}</span>
          <button onClick={logout} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 8,
            padding: '6px 12px', color: 'var(--text2)', cursor: 'pointer', fontSize: 12,
          }}>
            <i className="ti ti-logout" />
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>
        {gpsError && (
          <div style={{
            background: 'var(--yellow-dim)', border: '1px solid rgba(251,191,36,0.25)',
            color: 'var(--yellow)', borderRadius: 12, padding: '12px 16px',
            fontSize: 13, marginBottom: 20,
          }}>
            <i className="ti ti-map-pin-off" style={{ marginRight: 6 }} />{gpsError}
          </div>
        )}

        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

        {!showSelector && (
          <section style={{ marginBottom: 28, animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 12, fontFamily: 'Syne', color: 'var(--text2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
              Find Medicine
            </div>

            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <i className="ti ti-search" style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--blue)', fontSize: 18, pointerEvents: 'none'
                }} />
                <input
                  className="input-field"
                  style={{ paddingLeft: 44 }}
                  placeholder="e.g. Paracetamol 500mg, Amoxicillin..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={searching || !search.trim()}
                style={{
                  background: 'linear-gradient(135deg,#0EA5E9,#6366F1)',
                  border: 'none', borderRadius: 12, padding: '0 22px',
                  color: '#fff', fontFamily: 'Syne', fontWeight: 600, fontSize: 14,
                  cursor: searching || !search.trim() ? 'not-allowed' : 'pointer',
                  opacity: searching || !search.trim() ? 0.6 : 1,
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                {searching ? <span style={{ animation: 'pulse 1s infinite' }}>Searching...</span> : 'Search ?'}
              </button>
            </form>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {QUICK.map(q => (
                <button key={q} onClick={() => { setSearch(q); setTimeout(() => startSearch([q]), 50) }} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                  borderRadius: 20, padding: '5px 14px', fontSize: 12, color: 'var(--text2)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                  onMouseOver={e => { e.target.style.background = 'var(--blue-dim)'; e.target.style.color = 'var(--blue)'; e.target.style.borderColor = 'var(--border-blue)' }}
                  onMouseOut={e => { e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.color = 'var(--text2)'; e.target.style.borderColor = 'var(--border)' }}
                >
                  {q}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text3)', fontSize: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              or upload prescription
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <button
              onClick={() => fileRef.current?.click()}
              disabled={prescLoading}
              style={{
                width: '100%', background: 'rgba(129,140,248,0.06)',
                border: '1px dashed rgba(129,140,248,0.35)', borderRadius: 14,
                padding: 18, color: 'var(--purple)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontSize: 14, transition: 'all 0.3s',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(129,140,248,0.12)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(129,140,248,0.06)'}
            >
              <i className="ti ti-file-upload" style={{ fontSize: 20 }} />
              {prescLoading ? 'Scanning prescription...' : 'Upload Prescription Image or PDF'}
            </button>
            <input ref={fileRef} type="file" accept="image/*,.pdf" hidden onChange={handlePrescriptionUpload} />
          </section>
        )}

        {showSelector && prescMedicines && (
          <div style={{ marginBottom: 28 }}>
            <MedicineSelector
              medicines={prescMedicines}
              onConfirm={(selected) => startSearch(selected)}
              onCancel={() => { setShowSelector(false); setPrescMedicines(null) }}
            />
          </div>
        )}

        {/* Active request + Timer */}
        {activeRequest && (
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '14px 18px', marginBottom: 20,
            animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Request ID</div>
                <div style={{ fontFamily: 'Syne', fontSize: 14, color: 'var(--blue)', fontWeight: 600 }}>
                  {activeRequest.request_code}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
                  {activeRequest.medicine_names?.join(', ')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {activeRequest.status === 'closed' || timer === 0 ? (
                  <div style={{ color: 'var(--text3)', fontSize: 13 }}>
                    <i className="ti ti-clock-off" style={{ marginRight: 4 }} />Request Closed
                  </div>
                ) : timer > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--yellow)', fontSize: 13 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--yellow)', animation: 'ping 1s infinite' }} />
                      Waiting for shops...
                    </div>
                    <div style={{
                      fontSize: 22, fontFamily: 'Syne', fontWeight: 700,
                      color: timer <= 10 ? 'var(--red)' : 'var(--blue)',
                    }}>
                      {timer}s
                    </div>
                    <div style={{ width: 120, height: 4, background: 'var(--border)', borderRadius: 4 }}>
                      <div style={{
                        height: '100%', borderRadius: 4,
                        background: timer <= 10 ? 'var(--red)' : 'linear-gradient(90deg,#0EA5E9,#6366F1)',
                        width: `${(timer / WAIT_SECONDS) * 100}%`,
                        transition: 'width 1s linear',
                      }} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Notifications — distance ascending */}
        {notifications.length > 0 && (
          <section style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 12, fontFamily: 'Syne', color: 'var(--text2)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>
              Shop Responses ({notifications.length} found — nearest first)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notifications.map(n => (
                <NotificationCard key={n.id} notif={n} isNew={newNotifIds.has(n.id)} />
              ))}
            </div>
          </section>
        )}

        {!activeRequest && notifications.length === 0 && !showSelector && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)', animation: 'fadeIn 0.5s ease' }}>
            <i className="ti ti-building-store" style={{ fontSize: 48, display: 'block', marginBottom: 16, opacity: 0.3 }} />
            <p style={{ fontSize: 14, lineHeight: 1.8 }}>
              Search for a medicine or upload a prescription.<br />
              We'll notify all pharmacies within 5 km instantly.
            </p>
            {!gpsActive && (
              <button onClick={requestLocation} style={{
                marginTop: 20, background: 'var(--yellow-dim)',
                border: '1px solid rgba(251,191,36,0.3)', color: 'var(--yellow)',
                borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontSize: 13,
              }}>
                <i className="ti ti-map-pin" style={{ marginRight: 6 }} />Enable GPS to start
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}


