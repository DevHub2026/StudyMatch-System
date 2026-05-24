import { useState } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import * as authApi from '../../api/auth'
import { getUser, saveAuth, getToken } from '../../store/authStore'
import { Mail, ArrowRight, CheckCircle, RefreshCw } from 'lucide-react'
import logo    from '../../assets/logo.png'
import bgImage from '../../assets/background.png'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const user     = getUser()

  const [otp,            setOtp]            = useState('')
  const [verifying,      setVerifying]      = useState(false)
  const [resending,      setResending]      = useState(false)
  const [error,          setError]          = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [verified,       setVerified]       = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')
    setVerifying(true)
    try {
      await authApi.verifyEmail(otp)
      const updatedUser = { ...user, email_verified_at: new Date().toISOString() }
      saveAuth(getToken(), updatedUser)
      setVerified(true)
      setTimeout(() => navigate('/profile-setup'), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid verification code. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setSuccessMessage('')
    setResending(true)
    try {
      await authApi.resendVerification()
      setSuccessMessage('Verification code sent! Check your email.')
    } catch (err) {
      setError('Failed to resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        html,body,#root{height:100%;margin:0;padding:0;overflow:hidden;}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

        .ve-root{
          height:100vh;width:100vw;
          font-family:'Poppins',sans-serif;
          position:relative;display:flex;
          align-items:center;justify-content:center;overflow:hidden;
        }
        .ve-bg{
          position:absolute;inset:0;
          background-color:#0a0818;
          background-image:url(${bgImage});
          background-position:right center;
          background-size:contain;background-repeat:no-repeat;z-index:0;
        }
        .ve-overlay{
          position:absolute;inset:0;
          background:linear-gradient(100deg,rgba(5,4,16,0.92) 0%,rgba(5,4,16,0.75) 40%,rgba(5,4,16,0.4) 100%);
          z-index:1;
        }
        .ve-tint{
          position:absolute;inset:0;
          background:linear-gradient(100deg,rgba(40,15,100,0.25) 0%,rgba(40,15,100,0.08) 36%,transparent 60%);
          z-index:2;
        }
        .ve-card{
          position:relative;z-index:10;width:460px;
          background:rgba(8,6,24,0.75);
          border:1px solid rgba(120,90,240,0.22);
          border-radius:24px;padding:44px 48px 40px;
          backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
          display:flex;flex-direction:column;gap:26px;
          animation:cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes cardIn{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}

        .ve-logo{display:flex;flex-direction:column;align-items:center;gap:8px;}
        .ve-logo-icon{width:60px;height:60px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 16px rgba(124,92,250,0.55));}
        .ve-logo-icon img{width:100%;height:100%;object-fit:contain;}
        .ve-logo-name{font-size:32px;font-weight:700;color:#eae6ff;letter-spacing:-0.5px;line-height:1;}
        .ve-logo-name span{color:#7c5cfa;}
        .ve-logo-tagline{font-size:10px;color:rgba(255,255,255,0.28);font-weight:500;letter-spacing:1.5px;text-transform:uppercase;}

        .ve-icon-wrap{
          width:72px;height:72px;border-radius:50%;margin:0 auto;
          background:rgba(124,92,250,0.12);
          border:1px solid rgba(124,92,250,0.3);
          display:flex;align-items:center;justify-content:center;color:#7c5cfa;
        }
        .ve-heading{display:flex;flex-direction:column;gap:6px;text-align:center;}
        .ve-title{font-size:22px;font-weight:700;color:#eae6ff;letter-spacing:-0.3px;}
        .ve-sub{font-size:13px;color:rgba(255,255,255,0.32);line-height:1.6;}
        .ve-email{color:#c4b8ff;font-weight:600;}

        .ve-error{padding:11px 15px;background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.28);border-radius:10px;color:#fca5a5;font-size:13px;text-align:center;}
        .ve-success{padding:11px 15px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.28);border-radius:10px;color:#6ee7b7;font-size:13px;text-align:center;}

        .ve-form{display:flex;flex-direction:column;gap:16px;}
        .ve-label{font-size:12px;font-weight:600;color:rgba(255,255,255,0.4);letter-spacing:0.3px;text-align:center;}
        .ve-otp-input{
          width:100%;
          background:rgba(255,255,255,0.045);
          border:1px solid rgba(120,90,240,0.2);
          border-radius:11px;color:#ddd8ff;
          font-size:26px;font-family:'Poppins',sans-serif;
          font-weight:700;letter-spacing:10px;text-align:center;
          padding:14px 16px;outline:none;
          transition:border-color 0.2s,background 0.2s,box-shadow 0.2s;
        }
        .ve-otp-input::placeholder{color:rgba(255,255,255,0.15);letter-spacing:6px;font-size:18px;}
        .ve-otp-input:focus{border-color:rgba(124,92,250,0.6);background:rgba(124,92,250,0.07);box-shadow:0 0 0 3px rgba(124,92,250,0.1);}

        .ve-btn{
          width:100%;padding:15px;
          background:linear-gradient(135deg,#7c5cfa 0%,#5738d0 100%);
          color:#fff;border:none;border-radius:11px;
          font-size:15px;font-weight:600;font-family:'Poppins',sans-serif;
          cursor:pointer;letter-spacing:0.4px;
          transition:opacity 0.2s,transform 0.15s,box-shadow 0.2s;
          position:relative;overflow:hidden;
          display:flex;align-items:center;justify-content:center;gap:8px;
        }
        .ve-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.1) 0%,transparent 60%);pointer-events:none;}
        .ve-btn:hover:not(:disabled){opacity:0.92;transform:translateY(-1px);box-shadow:0 8px 28px rgba(124,92,250,0.38);}
        .ve-btn:active:not(:disabled){transform:scale(0.98);}
        .ve-btn:disabled{opacity:0.5;cursor:not-allowed;}

        .ve-resend-row{display:flex;flex-direction:column;align-items:center;gap:6px;}
        .ve-resend-text{font-size:13px;color:rgba(255,255,255,0.28);}
        .ve-resend-btn{
          background:none;border:none;color:#7c5cfa;font-size:13px;
          font-weight:600;cursor:pointer;font-family:'Poppins',sans-serif;
          display:flex;align-items:center;gap:5px;
          transition:color 0.2s;
        }
        .ve-resend-btn:hover:not(:disabled){color:#a78bfa;}
        .ve-resend-btn:disabled{opacity:0.5;cursor:not-allowed;}

        .ve-divider{width:100%;height:1px;background:linear-gradient(to right,transparent,rgba(120,90,240,0.2),transparent);}

        .ve-skip{
          text-align:center;font-size:13px;color:rgba(255,255,255,0.22);
          background:none;border:none;cursor:pointer;font-family:'Poppins',sans-serif;
          transition:color 0.2s;
        }
        .ve-skip:hover{color:rgba(255,255,255,0.5);}

        .ve-verified{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;}
        .ve-verified-icon{width:64px;height:64px;border-radius:50%;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);display:flex;align-items:center;justify-content:center;color:#10B981;}
        .ve-verified-title{font-size:18px;font-weight:700;color:#eae6ff;}
        .ve-verified-sub{font-size:13px;color:rgba(255,255,255,0.35);line-height:1.6;}

        @keyframes spin{to{transform:rotate(360deg);}}
        .ve-spinner{width:17px;height:17px;border:2.5px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin 0.6s linear infinite;}
      `}</style>

      <div className="ve-root">
        <div className="ve-bg" />
        <div className="ve-overlay" />
        <div className="ve-tint" />

        <div className="ve-card">
          {/* Logo */}
          <div className="ve-logo">
            <div className="ve-logo-icon"><img src={logo} alt="StudyMatch" /></div>
            <div className="ve-logo-name">Study<span>Match</span></div>
            <div className="ve-logo-tagline">Learning Platform</div>
          </div>

          {verified ? (
            <div className="ve-verified">
              <div className="ve-verified-icon"><CheckCircle size={32} strokeWidth={1.5} /></div>
              <div className="ve-verified-title">Email verified!</div>
              <div className="ve-verified-sub">
                Your email has been verified successfully.<br />
                Redirecting to profile setup...
              </div>
            </div>
          ) : (
            <>
              {/* Icon + heading */}
              <div className="ve-icon-wrap">
                <Mail size={30} strokeWidth={1.5} />
              </div>

              <div className="ve-heading">
                <div className="ve-title">Verify your email</div>
                <div className="ve-sub">
                  We sent a 6-digit code to<br />
                  <span className="ve-email">{user?.email || 'your email'}</span>
                </div>
              </div>

              {error          && <div className="ve-error">{error}</div>}
              {successMessage && <div className="ve-success">{successMessage}</div>}

              <form className="ve-form" onSubmit={handleVerify}>
                <div>
                  <div className="ve-label" style={{ marginBottom: 8 }}>Enter verification code</div>
                  <input
                    className="ve-otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="ve-btn"
                  disabled={verifying || otp.length !== 6}
                >
                  {verifying
                    ? <><div className="ve-spinner" /> Verifying...</>
                    : <><CheckCircle size={16} /> Verify Email</>
                  }
                </button>
              </form>

              {/* Resend */}
              <div className="ve-resend-row">
                <span className="ve-resend-text">Didn't receive the code?</span>
                <button className="ve-resend-btn" onClick={handleResend} disabled={resending}>
                  <RefreshCw size={13} style={{ animation: resending ? 'spin 0.6s linear infinite' : 'none' }} />
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
              </div>

              <div className="ve-divider" />

              <button className="ve-skip" onClick={() => navigate('/profile-setup')}>
                Skip for now →
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}