import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [form, setForm] = useState({ phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await authAPI.loginShop(form)
      login(data.access_token, { id: data.id, name: data.name, role: data.role })
      nav('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-center" style={{ background: '#080E1C' }}>
      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeIn 0.5s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontFamily: 'Syne', fontSize: 30, fontWeight: 700, color: '#F59E0B', marginBottom: 6
          }}>
            <i className="ti ti-building-store" style={{ marginRight: 8 }} />MediFind
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Pharmacy Owner Portal</p>
        </div>

        <div className="card" style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: 22, marginBottom: 6 }}>Shop Sign In</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28 }}>Access your pharmacy dashboard</p>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>Phone Number</label>
              <input className="input-field" type="tel" placeholder="+81 90 1234 5678"
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>Password</label>
              <input className="input-field" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}
              style={{ background: 'linear-gradient(135deg,#D97706,#F59E0B)' }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text2)' }}>
            New pharmacy? <Link to="/register" style={{ color: '#F59E0B', textDecoration: 'none' }}>Register here</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text3)' }}>
          Are you a patient?{' '}
          <a href="http://localhost:5173" style={{ color: 'var(--blue)', textDecoration: 'none' }}>Patient Login →</a>
        </p>
      </div>
    </div>
  )
}
