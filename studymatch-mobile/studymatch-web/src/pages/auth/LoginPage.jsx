import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { saveAuth } from '../../store/authStore'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import logo    from '../../assets/logo.png'
import bgImage from '../../assets/background.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)

  const handleSubmit = async (e) => {
  e.preventDefault()

  setError('')
  setLoading(true)

  try {
    const res = await login(email, password)

    saveAuth(
        res.data.token,
        res.data.user
      )

      const user = res.data.user
      console.log('USER:', user)
      console.log('ROLE:', user.role)

      if (user.role === 'admin') {
        navigate('/admin/dashboard')
      }
      else if (user.role === 'tutor') {
        navigate('/tutor/dashboard')
      }
      else {
        navigate('/student/dashboard')
      }

  } catch (err) {
    setError(
      err.response?.data?.message ||
      'Invalid email or password'
    )
  } finally {
    setLoading(false)
  }
}

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        html, body, #root { height:100%; margin:0; padding:0; overflow:hidden; }
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .lp-root {
          height:100vh; width:100vw;
          font-family:'Poppins',sans-serif;
          position:relative; display:flex;
          align-items:center; justify-content:center;
          overflow:hidden;
        }

        .lp-bg {
          position:absolute; inset:0;
          background:url(${bgImage}) right center / contain no-repeat, #0a0818;
          z-index:0;
        }

        .lp-overlay {
          position:absolute; inset:0;
          background:linear-gradient(100deg,rgba(5,4,16,0.92) 0%,rgba(5,4,16,0.50) 40%,rgba(5,4,16,0.4) 100%);
          z-index:1;
        }

        .lp-tint {
          position:absolute; inset:0;
          background:linear-gradient(100deg,rgba(40,15,100,0.25) 0%,rgba(40,15,100,0.08) 36%,transparent 60%);
          z-index:2;
        }

        /* ── Card ── */
        .lp-card {
          position:relative; z-index:10;
          width:480px;
          background:rgba(8,6,24,0.75);
          border:1px solid rgba(120,90,240,0.22);
          border-radius:24px;
          padding:44px 48px 40px;
          backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
          display:flex; flex-direction:column; gap:28px;
          animation:cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes cardIn {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* ── Logo ── */
        .lp-logo {
          display:flex; flex-direction:column; align-items:center; gap:8px;
        }

        .lp-logo-icon {
          width:64px; height:64px;
          display:flex; align-items:center; justify-content:center;
          filter:drop-shadow(0 0 16px rgba(124,92,250,0.55));
        }

        .lp-logo-icon img { width:100%; height:100%; object-fit:contain; }

        .lp-logo-name {
          font-size:36px; font-weight:700; color:#eae6ff;
          letter-spacing:-0.5px; line-height:1; text-align:center;
        }

        .lp-logo-name span { color:#7c5cfa; }

        .lp-logo-tagline {
          font-size:10px; color:rgba(255,255,255,0.28); font-weight:500;
          letter-spacing:1.5px; text-transform:uppercase;
        }

        /* ── Heading ── */
        .lp-heading {
          display:flex; flex-direction:column; gap:4px;
        }

        .lp-title {
          font-size:22px; font-weight:700; color:#eae6ff; letter-spacing:-0.3px;
        }

        .lp-sub {
          font-size:13px; color:rgba(255,255,255,0.32); line-height:1.5;
        }

        /* ── Error ── */
        .lp-error {
          padding:11px 15px;
          background:rgba(220,38,38,0.1);
          border:1px solid rgba(220,38,38,0.28);
          border-radius:10px; color:#fca5a5; font-size:13px;
        }

        /* ── Form ── */
        .lp-form { display:flex; flex-direction:column; gap:16px; }

        .lp-field-wrap { display:flex; flex-direction:column; gap:6px; }

        .lp-label {
          font-size:12px; font-weight:600;
          color:rgba(255,255,255,0.4); letter-spacing:0.3px;
        }

        .lp-field { position:relative; display:flex; align-items:center; }

        .lp-icon {
          position:absolute; left:14px;
          color:rgba(255,255,255,0.22); display:flex;
          pointer-events:none; z-index:1;
        }

        .lp-input {
          width:100%;
          background:rgba(255,255,255,0.045);
          border:1px solid rgba(120,90,240,0.2);
          border-radius:11px; color:#ddd8ff;
          font-size:14px; font-family:'Poppins',sans-serif;
          padding:13px 14px 13px 44px; outline:none;
          transition:border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-appearance:none; appearance:none;
        }

        .lp-input:-webkit-autofill,
        .lp-input:-webkit-autofill:hover,
        .lp-input:-webkit-autofill:focus,
        .lp-input:-webkit-autofill:active {
          -webkit-box-shadow:0 0 0 1000px rgba(124,92,250,0.07) inset !important;
          -webkit-text-fill-color:#ddd8ff !important;
          caret-color:#ddd8ff;
          border-color:rgba(124,92,250,0.6) !important;
          transition:background-color 5000s ease-in-out 0s;
        }

        .lp-input::placeholder { color:rgba(255,255,255,0.18); }

        .lp-input:focus {
          border-color:rgba(124,92,250,0.6);
          background:rgba(124,92,250,0.07);
          box-shadow:0 0 0 3px rgba(124,92,250,0.1);
        }

        .lp-eye {
          position:absolute; right:13px;
          background:none; border:none;
          color:rgba(255,255,255,0.22); cursor:pointer;
          padding:4px; display:flex; align-items:center;
          transition:color 0.2s;
        }

        .lp-eye:hover { color:rgba(255,255,255,0.55); }

        /* ── Remember / Forgot ── */
        .lp-row {
          display:flex; align-items:center;
          justify-content:space-between; margin-top:-2px;
        }

        .lp-remember {
          display:flex; align-items:center; gap:8px;
          cursor:pointer; user-select:none;
        }

        .lp-checkbox {
          width:16px; height:16px; border-radius:4px;
          border:1.5px solid rgba(124,92,250,0.35);
          background:rgba(255,255,255,0.03);
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0; cursor:pointer;
          transition:all 0.2s;
        }

        .lp-checkbox.on {
          background:#7c5cfa; border-color:#7c5cfa;
        }

        .lp-remember-label {
          font-size:13px; color:rgba(255,255,255,0.35); font-weight:500;
        }

        .lp-forgot {
          font-size:13px; color:#7c5cfa; font-weight:600;
          text-decoration:none; transition:color 0.2s;
        }

        .lp-forgot:hover { color:#a78bfa; }

        /* ── Button ── */
        .lp-btn {
          width:100%; padding:15px;
          background:linear-gradient(135deg,#7c5cfa 0%,#5738d0 100%);
          color:#fff; border:none; border-radius:11px;
          font-size:15px; font-weight:600; font-family:'Poppins',sans-serif;
          cursor:pointer; letter-spacing:0.4px;
          transition:opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          position:relative; overflow:hidden;
          margin-top:4px;
        }

        .lp-btn::after {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,0.1) 0%,transparent 60%);
          pointer-events:none;
        }

        .lp-btn:hover:not(:disabled) {
          opacity:0.92; transform:translateY(-1px);
          box-shadow:0 8px 28px rgba(124,92,250,0.38);
        }

        .lp-btn:active:not(:disabled) { transform:scale(0.98); }
        .lp-btn:disabled { opacity:0.5; cursor:not-allowed; }

        /* ── Divider ── */
        .lp-divider {
          width:100%; height:1px;
          background:linear-gradient(to right,transparent,rgba(120,90,240,0.2),transparent);
        }

        /* ── Footer ── */
        .lp-footer {
          font-size:13px; color:rgba(255,255,255,0.28);
          text-align:center;
        }

        .lp-footer a {
          color:#7c5cfa; text-decoration:none; font-weight:600;
        }

        .lp-footer a:hover { color:#a78bfa; }

        /* spinner */
        @keyframes spin { to { transform:rotate(360deg); } }
        .lp-spinner {
          width:17px; height:17px;
          border:2.5px solid rgba(255,255,255,0.3);
          border-top-color:#fff; border-radius:50%;
          animation:spin 0.6s linear infinite;
          display:inline-block; margin-right:8px;
          vertical-align:middle;
        }
      `}</style>

      <div className="lp-root">
        <div className="lp-bg" />
        <div className="lp-overlay" />
        <div className="lp-tint" />

        <div className="lp-card">

          {/* Logo */}
          <div className="lp-logo">
            <div className="lp-logo-icon">
              <img src={logo} alt="StudyMatch" />
            </div>
            <div className="lp-logo-name">Study<span>Match</span></div>
            <div className="lp-logo-tagline">Learning Platform</div>
          </div>

          {/* Heading */}
          <div className="lp-heading">
            <div className="lp-title">Welcome back</div>
            <div className="lp-sub">Sign in to your StudyMatch account</div>
          </div>

          {/* Error */}
          {error && <div className="lp-error">{error}</div>}

          {/* Form */}
          <form className="lp-form" onSubmit={handleSubmit}>

            <div className="lp-field-wrap">
              <label className="lp-label">Email</label>
              <div className="lp-field">
                <span className="lp-icon"><Mail size={16} /></span>
                <input className="lp-input" type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="lp-field-wrap">
              <label className="lp-label">Password</label>
              <div className="lp-field">
                <span className="lp-icon"><Lock size={16} /></span>
                <input className="lp-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required style={{ paddingRight: '42px' }} />
                <button type="button" className="lp-eye" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="lp-row">
              <label className="lp-remember" onClick={() => setRemember(!remember)}>
                <div className={`lp-checkbox${remember ? ' on' : ''}`}>
                  {remember && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="lp-remember-label">Remember me</span>
              </label>
              <NavLink to="/forgot-password" className="lp-forgot">
                Forgot password?
              </NavLink>
            </div>

            <button type="submit" className="lp-btn" disabled={loading}>
              {loading ? (
                <><span className="lp-spinner" />Signing in...</>
              ) : 'Sign in'}
            </button>

          </form>

          <div className="lp-divider" />

          <div className="lp-footer">
            Don't have an account?{' '}
            <NavLink to="/register">Create Account</NavLink>
          </div>

        </div>
      </div>
    </>
  )
}