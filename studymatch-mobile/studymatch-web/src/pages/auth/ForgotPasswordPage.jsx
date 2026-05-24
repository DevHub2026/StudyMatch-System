import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { forgotPassword } from '../../api/auth'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import logo    from '../../assets/logo.png'
import bgImage from '../../assets/background.png'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
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

        .fp-root {
          height:100vh; width:100vw;
          font-family:'Poppins',sans-serif;
          position:relative; display:flex;
          align-items:center; justify-content:center;
          overflow:hidden;
        }

        .fp-bg {
          position:absolute; inset:0;
          background-color: #0a0818;
          background-image: url(${bgImage});
          background-position: right center;
          background-size: contain;
          background-repeat: no-repeat;
          z-index:0;
        }

        .fp-overlay {
          position:absolute; inset:0;
          background:linear-gradient(100deg,rgba(5,4,16,0.92) 0%,rgba(5,4,16,0.75) 40%,rgba(5,4,16,0.4) 100%);
          z-index:1;
        }

        .fp-tint {
          position:absolute; inset:0;
          background:linear-gradient(100deg,rgba(40,15,100,0.25) 0%,rgba(40,15,100,0.08) 36%,transparent 60%);
          z-index:2;
        }

        /* ── Card ── */
        .fp-card {
          position:relative; z-index:10;
          width:460px;
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
        .fp-logo {
          display:flex; flex-direction:column; align-items:center; gap:8px;
        }

        .fp-logo-icon {
          width:60px; height:60px;
          display:flex; align-items:center; justify-content:center;
          filter:drop-shadow(0 0 16px rgba(124,92,250,0.55));
        }

        .fp-logo-icon img { width:100%; height:100%; object-fit:contain; }

        .fp-logo-name {
          font-size:34px; font-weight:700; color:#eae6ff;
          letter-spacing:-0.5px; line-height:1; text-align:center;
        }

        .fp-logo-name span { color:#7c5cfa; }

        .fp-logo-tagline {
          font-size:10px; color:rgba(255,255,255,0.28); font-weight:500;
          letter-spacing:1.5px; text-transform:uppercase;
        }

        /* ── Heading ── */
        .fp-heading { display:flex; flex-direction:column; gap:4px; }
        .fp-title { font-size:22px; font-weight:700; color:#eae6ff; letter-spacing:-0.3px; }
        .fp-sub { font-size:13px; color:rgba(255,255,255,0.32); line-height:1.5; }

        /* ── Error ── */
        .fp-error {
          padding:11px 15px;
          background:rgba(220,38,38,0.1);
          border:1px solid rgba(220,38,38,0.28);
          border-radius:10px; color:#fca5a5; font-size:13px;
        }

        /* ── Form ── */
        .fp-form { display:flex; flex-direction:column; gap:16px; }

        .fp-field-wrap { display:flex; flex-direction:column; gap:6px; }

        .fp-label {
          font-size:12px; font-weight:600;
          color:rgba(255,255,255,0.4); letter-spacing:0.3px;
        }

        .fp-field { position:relative; display:flex; align-items:center; }

        .fp-icon {
          position:absolute; left:14px;
          color:rgba(255,255,255,0.22); display:flex;
          pointer-events:none; z-index:1;
        }

        .fp-input {
          width:100%;
          background:rgba(255,255,255,0.045);
          border:1px solid rgba(120,90,240,0.2);
          border-radius:11px; color:#ddd8ff;
          font-size:14px; font-family:'Poppins',sans-serif;
          padding:13px 14px 13px 44px; outline:none;
          transition:border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-appearance:none; appearance:none;
        }

        .fp-input:-webkit-autofill,
        .fp-input:-webkit-autofill:hover,
        .fp-input:-webkit-autofill:focus {
          -webkit-box-shadow:0 0 0 1000px rgba(124,92,250,0.07) inset !important;
          -webkit-text-fill-color:#ddd8ff !important;
          caret-color:#ddd8ff;
          border-color:rgba(124,92,250,0.6) !important;
          transition:background-color 5000s ease-in-out 0s;
        }

        .fp-input::placeholder { color:rgba(255,255,255,0.18); }

        .fp-input:focus {
          border-color:rgba(124,92,250,0.6);
          background:rgba(124,92,250,0.07);
          box-shadow:0 0 0 3px rgba(124,92,250,0.1);
        }

        /* ── Button ── */
        .fp-btn {
          width:100%; padding:15px;
          background:linear-gradient(135deg,#7c5cfa 0%,#5738d0 100%);
          color:#fff; border:none; border-radius:11px;
          font-size:15px; font-weight:600; font-family:'Poppins',sans-serif;
          cursor:pointer; letter-spacing:0.4px;
          transition:opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          position:relative; overflow:hidden;
        }

        .fp-btn::after {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,0.1) 0%,transparent 60%);
          pointer-events:none;
        }

        .fp-btn:hover:not(:disabled) {
          opacity:0.92; transform:translateY(-1px);
          box-shadow:0 8px 28px rgba(124,92,250,0.38);
        }

        .fp-btn:active:not(:disabled) { transform:scale(0.98); }
        .fp-btn:disabled { opacity:0.5; cursor:not-allowed; }

        /* ── Success state ── */
        .fp-success {
          display:flex; flex-direction:column; align-items:center;
          gap:16px; text-align:center; padding:8px 0;
        }

        .fp-success-icon {
          width:64px; height:64px; border-radius:50%;
          background:rgba(124,92,250,0.12);
          border:1px solid rgba(124,92,250,0.3);
          display:flex; align-items:center; justify-content:center;
          color:#7c5cfa;
        }

        .fp-success-title {
          font-size:18px; font-weight:700; color:#eae6ff;
        }

        .fp-success-sub {
          font-size:13px; color:rgba(255,255,255,0.35); line-height:1.6;
        }

        .fp-success-link {
          display:inline-block; padding:13px 32px;
          background:linear-gradient(135deg,#7c5cfa 0%,#5738d0 100%);
          color:#fff; border-radius:11px; font-size:14px;
          font-weight:600; text-decoration:none;
          transition:opacity 0.2s, transform 0.15s, box-shadow 0.2s;
        }

        .fp-success-link:hover {
          opacity:0.9; transform:translateY(-1px);
          box-shadow:0 8px 24px rgba(124,92,250,0.35);
        }

        /* ── Divider ── */
        .fp-divider {
          width:100%; height:1px;
          background:linear-gradient(to right,transparent,rgba(120,90,240,0.2),transparent);
        }

        /* ── Back link ── */
        .fp-back {
          display:flex; align-items:center; justify-content:center;
          gap:6px; font-size:13px; color:rgba(255,255,255,0.28);
          text-decoration:none; font-weight:500;
          transition:color 0.2s;
        }

        .fp-back:hover { color:#7c5cfa; }

        @keyframes spin { to { transform:rotate(360deg); } }
        .fp-spinner {
          width:17px; height:17px;
          border:2.5px solid rgba(255,255,255,0.3);
          border-top-color:#fff; border-radius:50%;
          animation:spin 0.6s linear infinite;
          display:inline-block; margin-right:8px;
          vertical-align:middle;
        }
      `}</style>

      <div className="fp-root">
        <div className="fp-bg" />
        <div className="fp-overlay" />
        <div className="fp-tint" />

        <div className="fp-card">

          {/* Logo */}
          <div className="fp-logo">
            <div className="fp-logo-icon">
              <img src={logo} alt="StudyMatch" />
            </div>
            <div className="fp-logo-name">Study<span>Match</span></div>
            <div className="fp-logo-tagline">Learning Platform</div>
          </div>

          {sent ? (
            /* ── Success State ── */
            <div className="fp-success">
              <div className="fp-success-icon">
                <CheckCircle size={32} strokeWidth={1.5} />
              </div>
              <div className="fp-success-title">Check your email</div>
              <div className="fp-success-sub">
                We sent a password reset link to<br />
                <strong style={{ color: '#c4b8ff' }}>{email}</strong><br />
                Check your inbox and follow the instructions.
              </div>
              <NavLink to="/reset-password" className="fp-success-link">
                Enter reset code
              </NavLink>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              <div className="fp-heading">
                <div className="fp-title">Forgot password?</div>
                <div className="fp-sub">No worries — we'll send you a reset code.</div>
              </div>

              {error && <div className="fp-error">{error}</div>}

              <form className="fp-form" onSubmit={handleSubmit}>
                <div className="fp-field-wrap">
                  <label className="fp-label">Email</label>
                  <div className="fp-field">
                    <span className="fp-icon"><Mail size={16} /></span>
                    <input className="fp-input" type="email"
                      placeholder="you@example.com"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      required />
                  </div>
                </div>

                <button type="submit" className="fp-btn" disabled={loading}>
                  {loading ? (
                    <><span className="fp-spinner" />Sending...</>
                  ) : 'Send reset code'}
                </button>
              </form>
            </>
          )}

          <div className="fp-divider" />

          <NavLink to="/login" className="fp-back">
            <ArrowLeft size={15} /> Back to sign in
          </NavLink>

        </div>
      </div>
    </>
  )
}