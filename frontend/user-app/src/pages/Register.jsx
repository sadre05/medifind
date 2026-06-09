import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const { data } = await authAPI.registerUser({
        name: form.name, phone: form.phone,
        email: form.email || undefined, password: form.password
      })
      login(data.access_token, { id: data.id, name: data.name, role: data.role })
      nav('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) })

  return (
    <div className="page-center">
      <div style={{ width: '100%', maxWidth: 440, animation: 'fadeIn 0.5s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            fontFamily: 'Syne', fontSize: 28, fontWeight: 700,
            background: 'linear-gradient(90deg,#38BDF8,#818CF8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            <i className="ti ti-pill" style={{ marginRight: 8 }} />MediFind
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 6 }}>Patient Registration</p>
        </div>

        <div className="card">
          <h2 style={{ fontFamily: 'Syne', fontSize: 20, marginBottom: 20 }}>Create your account</h2>
          {error && <div className="error-msg"><i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{error}</div>}

          <form onSubmit={handleSubmit}>
            {[
              { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Kenji Tanaka' },
              { key: 'phone', label: 'Phone Number *', type: 'tel', placeholder: '+81 90 1234 5678' },
              { key: 'email', label: 'Email (optional)', type: 'email', placeholder: 'you@email.com' },
              { key: 'password', label: 'Password *', type: 'password', placeholder: '••••••••' },
              { key: 'confirm', label: 'Confirm Password *', type: 'password', placeholder: '••••••••' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>{label}</label>
                <input className="input-field" type={type} placeholder={placeholder} required={!label.includes('optional')} {...f(key)} />
              </div>
            ))}

            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: 'var(--text2)' }}>
            Already registered? <Link to="/login" style={{ color: 'var(--blue)', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
