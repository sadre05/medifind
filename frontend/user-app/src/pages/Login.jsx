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
      const { data } = await authAPI.loginUser(form)
      login(data.access_token, { id: data.id, name: data.name, role: data.role })
      nav('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-center" style={{ background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeIn 0.5s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontFamily: 'Syne', fontSize: 32, fontWeight: 700,
            background: 'linear-gradient(90deg, #38BDF8, #818CF8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 8
          }}>
            <i className="ti ti-pill" style={{ marginRight: 8 }} />MediFind
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Find medicine at nearby pharmacies</p>
        </div>

        <div className="card">
          <h2 style={{ fontFamily: 'Syne', fontSize: 22, marginBottom: 6 }}>Welcome back</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28 }}>Sign in to your patient account</p>

          {error && <div className="error-msg"><i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                Phone Number
              </label>
              <input
                className="input-field"
                type="tel"
                placeholder="+81 90 1234 5678"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                required
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
                Password
              </label>
              <input
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text2)' }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--blue)', textDecoration: 'none' }}>
              Create one
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text3)' }}>
          Are you a pharmacy?{' '}
          <a href="http://localhost:5174" style={{ color: 'var(--purple)', textDecoration: 'none' }}>
            Shop Owner Login →
          </a>
        </p>
      </div>
    </div>
  )
}
