import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const [form, setForm] = useState({
    owner_name: '', shop_name: '', phone: '', email: '',
    password: '', confirm: '', address: '', license_number: '',
    latitude: '', longitude: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  function getGPS() {
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({ ...f, latitude: pos.coords.latitude.toString(), longitude: pos.coords.longitude.toString() }))
        setGpsLoading(false)
      },
      () => { setError('Could not get location'); setGpsLoading(false) }
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (!form.latitude || !form.longitude) { setError('Please set shop GPS location'); return }
    setLoading(true)
    try {
      const { data } = await authAPI.registerShop({
        owner_name: form.owner_name, shop_name: form.shop_name,
        phone: form.phone, email: form.email, password: form.password,
        latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude),
        address: form.address || undefined, license_number: form.license_number || undefined,
      })
      login(data.access_token, { id: data.id, name: data.name })
      nav('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })

  return (
    <div className="page-center" style={{ background: '#080E1C' }}>
      <div style={{ width: '100%', maxWidth: 480, animation: 'fadeIn 0.5s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 700, color: '#F59E0B' }}>
            <i className="ti ti-building-store" style={{ marginRight: 8 }} />MediFind
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Pharmacy Registration</p>
        </div>

        <div className="card" style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: 20, marginBottom: 20 }}>Register Your Pharmacy</h2>
          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[
                { key: 'owner_name', label: 'Owner Name *', placeholder: 'Hiroshi Yamada' },
                { key: 'shop_name', label: 'Pharmacy Name *', placeholder: 'Sakura Pharmacy' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{label}</label>
                  <input className="input-field" placeholder={placeholder} required {...f(key)} />
                </div>
              ))}
            </div>

            {[
              { key: 'phone', label: 'Phone *', type: 'tel', placeholder: '+81 90 1234 5678' },
              { key: 'email', label: 'Email *', type: 'email', placeholder: 'pharmacy@email.com' },
              { key: 'address', label: 'Address', type: 'text', placeholder: '1-2-3 Shibuya, Tokyo' },
              { key: 'license_number', label: 'Pharmacy License No.', type: 'text', placeholder: 'LIC-12345' },
              { key: 'password', label: 'Password *', type: 'password', placeholder: '••••••••' },
              { key: 'confirm', label: 'Confirm Password *', type: 'password', placeholder: '••••••••' },
            ].map(({ key, label, type = 'text', placeholder }) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{label}</label>
                <input className="input-field" type={type} placeholder={placeholder}
                  required={label.includes('*')} {...f(key)} />
              </div>
            ))}

            {/* GPS location */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                Shop GPS Location *
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input-field" placeholder="Latitude" type="number" step="any" required {...f('latitude')} style={{ flex: 1 }} />
                <input className="input-field" placeholder="Longitude" type="number" step="any" required {...f('longitude')} style={{ flex: 1 }} />
                <button type="button" onClick={getGPS} disabled={gpsLoading} style={{
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 10, padding: '0 14px', color: '#F59E0B', cursor: 'pointer', flexShrink: 0, fontSize: 18,
                }}>
                  <i className={`ti ti-${gpsLoading ? 'loader' : 'map-pin'}`} />
                </button>
              </div>
              {form.latitude && (
                <p style={{ fontSize: 11, color: 'var(--green)', marginTop: 4 }}>
                  <i className="ti ti-check" style={{ marginRight: 4 }} />
                  Location set: {parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)}
                </p>
              )}
            </div>

            <button className="btn-primary" type="submit" disabled={loading}
              style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
              {loading ? 'Registering...' : 'Register Pharmacy →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text2)' }}>
            Already registered? <Link to="/login" style={{ color: '#F59E0B', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
