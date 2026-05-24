import { useState } from 'react'
import { useNavigate, useSearchParams, NavLink } from 'react-router-dom'
import * as authApi from '../../api/auth'
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import logo    from '../../assets/logo.png'
import bgImage from '../../assets/background.png'

export default function ResetPasswordPage() {
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()

  const emailParam = searchParams.get('email') || ''
  const tokenParam = searchParams.get('token') || ''

  const [formData, setFormData] = useState({
    email:                 emailParam,
    token:                 tokenParam,
    password:              '',
    password_confirmation: '',
  })
  const [showPw,    setShowPw]    = useState(false)
  const [showConf,  setShowConf]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [errors,    setErrors]    = useState({})
  const [success,   setSuccess]   = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    if (formData.password !== formData.password_confirmation) {
      setErrors({ password_confirmation: 'Passwords do not match' })
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(
        formData.email,
        formData.token,
        formData.password,
        formData.password_confirmation,
      )
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
      } else {
        setErrors({ general: err.response?.data?.message || 'Failed to reset password. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        html,body,#root{height:100%;margin:0;padding:0;overflow:hidden;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

        .rp-root{
          height:100vh;width:100vw;
          font-family:'Poppins',sans-serif;
          position:relative;display:flex;
          align-items:center;justify-content:center;
          overflow:hidden;
        }
        .rp-bg{
          position:absolute;inset:0;
          background-color:#0a0818;
          background-image:url(${bgImage});
          background-position:right center;
          background-size:contain;background-repeat:no-repeat;
          z-index:0;
        }
        .rp-overlay{
          position:absolute;inset:0;
          background:linear-gradient(100deg,rgba(5,4,16,0.92) 0%,rgba(5,4,16,0.75) 40%,rgba(5,4,16,0.4) 100%);
          z-index:1;
        }
        .rp-tint{
          position:absolute;inset:0;
          background:linear-gradient(100deg,rgba(40,15,100,0.25) 0%,rgba(40,15,100,0.08) 36%,transparent 60%);
          z-index:2;
        }

        .rp-card{
          position:relative;z-index:10;
          width:480px;
          background:rgba(8,6,24,0.75);
          border:1px solid rgba(120,90,240,0.22);
          border-radius:24px;
          padding:44px 48px 40px;
          backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
          display:flex;flex-direction:column;gap:24px;
          animation:cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes cardIn{
          from{opacity:0;transform:translateY(20px);}
          to{opacity:1;transform:translateY(0);}
        }

        .rp-logo{display:flex;flex-direction:column;align-items:center;gap:8px;}
        .rp-logo-icon{
          width:60px;height:60px;
          display:flex;align-items:center;justify-content:center;
          filter:drop-shadow(0 0 16px rgba(124,92,250,0.55));
        }
        .rp-logo-icon img{width:100%;height:100%;object-fit:contain;}
        .rp-logo-name{font-size:32px;font-weight:700;color:#eae6ff;letter-spacing:-0.5px;line-height:1;}
        .rp-logo-name span{color:#7c5cfa;}
        .rp-logo-tagline{font-size:10px;color:rgba(255,255,255,0.28);font-weight:500;letter-spacing:1.5px;text-transform:uppercase;}

        .rp-heading{display:flex;flex-direction:column;gap:4px;}
        .rp-title{font-size:22px;font-weight:700;color:#eae6ff;letter-spacing:-0.3px;}
        .rp-sub{font-size:13px;color:rgba(255,255,255,0.32);line-height:1.5;}

        .rp-error{
          padding:11px 15px;
          background:rgba(220,38,38,0.1);
          border:1px solid rgba(220,38,38,0.28);
          border-radius:10px;color:#fca5a5;font-size:13px;
        }
        .rp-field-error{font-size:12px;color:#fca5a5;margin-top:4px;}

        .rp-form{display:flex;flex-direction:column;gap:14px;}
        .rp-field-wrap{display:flex;flex-direction:column;gap:6px;}
        .rp-label{font-size:12px;font-weight:600;color:rgba(255,255,255,0.4);letter-spacing:0.3px;}
        .rp-field{position:relative;display:flex;align-items:center;}
        .rp-icon{position:absolute;left:14px;color:rgba(255,255,255,0.22);display:flex;pointer-events:none;z-index:1;}
        .rp-input{
          width:100%;
          background:rgba(255,255,255,0.045);
          border:1px solid rgba(120,90,240,0.2);
          border-radius:11px;color:#ddd8ff;
          font-size:14px;font-family:'Poppins',sans-serif;
          padding:13px 42px 13px 44px;outline:none;
          transition:border-color 0.2s,background 0.2s,box-shadow 0.2s;
        }
        .rp-input::placeholder{color:rgba(255,255,255,0.18);}
        .rp-input:focus{
          border-color:rgba(124,92,250,0.6);
          background:rgba(124,92,250,0.07);
          box-shadow:0 0 0 3px rgba(124,92,250,0.1);
        }
        .rp-input:-webkit-autofill{
          -webkit-box-shadow:0 0 0 1000px rgba(124,92,250,0.07) inset !important;
          -webkit-text-fill-color:#ddd8ff !important;
          border-color:rgba(124,92,250,0.6) !important;
          transition:background-color 5000s ease-in-out 0s;
        }
        .rp-eye{
          position:absolute;right:13px;
          background:none;border:none;
          color:rgba(255,255,255,0.22);cursor:pointer;
          padding:4px;display:flex;align-items:center;
          transition:color 0.2s;
        }
        .rp-eye:hover{color:rgba(255,255,255,0.55);}

        .rp-hint{font-size:11px;color:rgba(255,255,255,0.25);margin-top:3px;}

        .rp-btn{
          width:100%;padding:15px;
          background:linear-gradient(135deg,#7c5cfa 0%,#5738d0 100%);
          color:#fff;border:none;border-radius:11px;
          font-size:15px;font-weight:600;font-family:'Poppins',sans-serif;
          cursor:pointer;letter-spacing:0.4px;
          transition:opacity 0.2s,transform 0.15s,box-shadow 0.2s;
          position:relative;overflow:hidden;margin-top:4px;
        }
        .rp-btn::after{
          content:'';position:absolute;inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,0.1) 0%,transparent 60%);
          pointer-events:none;
        }
        .rp-btn:hover:not(:disabled){opacity:0.92;transform:translateY(-1px);box-shadow:0 8px 28px rgba(124,92,250,0.38);}
        .rp-btn:active:not(:disabled){transform:scale(0.98);}
        .rp-btn:disabled{opacity:0.5;cursor:not-allowed;}

        .rp-success{
          display:flex;flex-direction:column;align-items:center;
          gap:14px;text-align:center;padding:8px 0;
        }
        .rp-success-icon{
          width:64px;height:64px;border-radius:50%;
          background:rgba(124,92,250,0.12);
          border:1px solid rgba(124,92,250,0.3);
          display:flex;align-items:center;justify-content:center;color:#7c5cfa;
        }
        .rp-success-title{font-size:18px;font-weight:700;color:#eae6ff;}
        .rp-success-sub{font-size:13px;color:rgba(255,255,255,0.35);line-height:1.6;}

        .rp-divider{
          width:100%;height:1px;
          background:linear-gradient(to right,transparent,rgba(120,90,240,0.2),transparent);
        }
        .rp-back{
          display:flex;align-items:center;justify-content:center;
          gap:6px;font-size:13px;color:rgba(255,255,255,0.28);
          text-decoration:none;font-weight:500;transition:color 0.2s;
        }
        .rp-back:hover{color:#7c5cfa;}

        @keyframes spin{to{transform:rotate(360deg);}}
        .rp-spinner{
          width:17px;height:17px;
          border:2.5px solid rgba(255,255,255,0.3);
          border-top-color:#fff;border-radius:50%;
          animation:spin 0.6s linear infinite;
          display:inline-block;margin-right:8px;vertical-align:middle;
        }
      `}</style>

      <div className="rp-root">
        <div className="rp-bg" />
        <div className="rp-overlay" />
        <div className="rp-tint" />

        <div className="rp-card">
          {/* Logo */}
          <div className="rp-logo">
            <div className="rp-logo-icon"><img src={logo} alt="StudyMatch" /></div>
            <div className="rp-logo-name">Study<span>Match</span></div>
            <div className="rp-logo-tagline">Learning Platform</div>
          </div>

          {success ? (
            <div className="rp-success">
              <div className="rp-success-icon"><CheckCircle size={32} strokeWidth={1.5} /></div>
              <div className="rp-success-title">Password reset!</div>
              <div className="rp-success-sub">
                Your password has been updated successfully.<br />
                Redirecting you to login...
              </div>
            </div>
          ) : (
            <>
              <div className="rp-heading">
                <div className="rp-title">Reset password</div>
                <div className="rp-sub">Create a new secure password for your account.</div>
              </div>

              {errors.general && <div className="rp-error">{errors.general}</div>}

              <form className="rp-form" onSubmit={handleSubmit}>
                {/* Email */}
                <div className="rp-field-wrap">
                  <label className="rp-label">Email</label>
                  <div className="rp-field">
                    <input
                      className="rp-input" type="email" name="email"
                      value={formData.email} onChange={handleChange}
                      placeholder="you@example.com"
                      required readOnly={!!emailParam}
                      style={{ paddingLeft: 16 }}
                    />
                  </div>
                  {errors.email && <div className="rp-field-error">{errors.email}</div>}
                </div>

                {/* Token — only show if not in URL */}
                {!tokenParam && (
                  <div className="rp-field-wrap">
                    <label className="rp-label">Reset Code</label>
                    <div className="rp-field">
                      <input
                        className="rp-input" type="text" name="token"
                        value={formData.token} onChange={handleChange}
                        placeholder="Enter code from email"
                        required style={{ paddingLeft: 16 }}
                      />
                    </div>
                    {errors.token && <div className="rp-field-error">{errors.token}</div>}
                  </div>
                )}

                {/* New Password */}
                <div className="rp-field-wrap">
                  <label className="rp-label">New Password</label>
                  <div className="rp-field">
                    <span className="rp-icon"><Lock size={16} /></span>
                    <input
                      className="rp-input" name="password"
                      type={showPw ? 'text' : 'password'}
                      value={formData.password} onChange={handleChange}
                      placeholder="••••••••" required minLength={8}
                    />
                    <button type="button" className="rp-eye" onClick={() => setShowPw(p => !p)}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="rp-hint">Must be at least 8 characters</div>
                  {errors.password && <div className="rp-field-error">{errors.password}</div>}
                </div>

                {/* Confirm Password */}
                <div className="rp-field-wrap">
                  <label className="rp-label">Confirm Password</label>
                  <div className="rp-field">
                    <span className="rp-icon"><Lock size={16} /></span>
                    <input
                      className="rp-input" name="password_confirmation"
                      type={showConf ? 'text' : 'password'}
                      value={formData.password_confirmation} onChange={handleChange}
                      placeholder="••••••••" required
                    />
                    <button type="button" className="rp-eye" onClick={() => setShowConf(p => !p)}>
                      {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password_confirmation && (
                    <div className="rp-field-error">{errors.password_confirmation}</div>
                  )}
                </div>

                <button type="submit" className="rp-btn" disabled={loading}>
                  {loading ? <><span className="rp-spinner" />Resetting...</> : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          <div className="rp-divider" />
          <NavLink to="/login" className="rp-back">
            <ArrowLeft size={15} /> Back to sign in
          </NavLink>
        </div>
      </div>
    </>
  )
}