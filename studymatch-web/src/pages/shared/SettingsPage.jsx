import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getUser, clearAuth, saveAuth, getToken } from '../../store/authStore'
import { updatePassword, deleteAccount, updateProfile } from '../../api/profile'
import {
  User, Lock, Mail, Shield, Trash2, ChevronRight,
  CheckCircle, Bell, Calendar, MessageSquare,
  Megaphone, UserCheck, HelpCircle, Wallet,
  Eye, EyeOff, Loader2, Save, Edit2, X,
} from 'lucide-react'

const TABS = ['Account', 'Notifications', 'Privacy', 'Preferences', 'Appearance']

function Toggle({ on, onClick }) {
  return (
    <div onClick={onClick} style={{
      width: 44, height: 24, borderRadius: 12,
      background: on ? '#7C3AED' : '#D1D5DB',
      position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: 'white', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </div>
  )
}

export default function SettingsPage() {
  const [user, setUser]   = useState(() => getUser())
  const navigate          = useNavigate()
  const location          = useLocation()
  const isTutor           = user?.role === 'tutor'
  const base              = isTutor ? '/tutor/settings' : '/student/settings'

  const tabFromPath = (p) => {
    if (p.includes('/notifications')) return 'Notifications'
    if (p.includes('/privacy'))       return 'Privacy'
    if (p.includes('/preferences'))   return 'Preferences'
    if (p.includes('/appearance'))    return 'Appearance'
    return 'Account'
  }

  const [activeTab, setActiveTab] = useState(() => tabFromPath(location.pathname))
  useEffect(() => { setActiveTab(tabFromPath(location.pathname)) }, [location.pathname])

  // ── Password ───────────────────────────────────────────────
  const [pwForm, setPwForm]     = useState({ current_password: '', password: '', password_confirmation: '' })
  const [showPw,  setShowPw]    = useState({})
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError,   setPwError]   = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  // ── Delete Account ─────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [delError,      setDelError]      = useState('')
  const [delPassword,   setDelPassword]   = useState('')
  const [showDelPw,     setShowDelPw]     = useState(false)

  // ── Edit Profile ───────────────────────────────────────────
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm,    setProfileForm]    = useState({ name: user?.name || '', bio: user?.bio || '' })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError,   setProfileError]   = useState('')
  const [profileSuccess, setProfileSuccess] = useState(false)

  // ── Edit Email ─────────────────────────────────────────────
  const [editingEmail, setEditingEmail] = useState(false)
  const [emailForm,    setEmailForm]    = useState({ email: '', current_password: '' })
  const [showEmailPw,  setShowEmailPw]  = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError,   setEmailError]   = useState('')
  const [emailSuccess, setEmailSuccess] = useState(false)

  // ── 2FA ────────────────────────────────────────────────────
  const [twoFA, setTwoFA] = useState(() => {
    const stored = localStorage.getItem('settings_2fa')
    return stored !== null ? stored === 'true' : true
  })
  useEffect(() => { localStorage.setItem('settings_2fa', twoFA) }, [twoFA])

  // ── Notifications tab (basic toggles) ─────────────────────
  const [notifToggles, setNotifToggles] = useState({ email: true, marketing: false })

  // ── Privacy tab ────────────────────────────────────────────
  const ls = (k, d) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : d } catch { return d } }
  const [privVisibility, setPrivVisibility] = useState(() => ls('set_visibility', 'Everyone'))
  const [privOnline,     setPrivOnline]     = useState(() => ls('set_online',     true))
  const [privHistory,    setPrivHistory]    = useState(() => ls('set_history',    'Tutors only'))
  useEffect(() => { localStorage.setItem('set_visibility', JSON.stringify(privVisibility)) }, [privVisibility])
  useEffect(() => { localStorage.setItem('set_online',     JSON.stringify(privOnline))     }, [privOnline])
  useEffect(() => { localStorage.setItem('set_history',    JSON.stringify(privHistory))    }, [privHistory])

  // ── Preferences tab ────────────────────────────────────────
  const [prefLang,     setPrefLang]     = useState(() => ls('set_lang',     'English (US)'))
  const [prefTz,       setPrefTz]       = useState(() => ls('set_tz',       'UTC+8 (PHT)'))
  const [prefReminder, setPrefReminder] = useState(() => ls('set_reminder', '15 minutes'))
  const [prefSession,  setPrefSession]  = useState(() => ls('set_session',  'Online'))
  useEffect(() => { localStorage.setItem('set_lang',     JSON.stringify(prefLang))     }, [prefLang])
  useEffect(() => { localStorage.setItem('set_tz',       JSON.stringify(prefTz))       }, [prefTz])
  useEffect(() => { localStorage.setItem('set_reminder', JSON.stringify(prefReminder)) }, [prefReminder])
  useEffect(() => { localStorage.setItem('set_session',  JSON.stringify(prefSession))  }, [prefSession])

  // ── Appearance tab ─────────────────────────────────────────
  const [theme,       setTheme]       = useState(() => ls('set_theme', 'light'))
  const [accentColor, setAccentColor] = useState(() => ls('set_accent', '#7C3AED'))
  useEffect(() => { localStorage.setItem('set_theme',  JSON.stringify(theme))       }, [theme])
  useEffect(() => { localStorage.setItem('set_accent', JSON.stringify(accentColor)) }, [accentColor])

  const NOTIF_ROWS = [
    { icon: Calendar,      label: 'Session Confirmations', value: 'Email' },
    { icon: Shield,        label: 'Session Reminders',     value: 'Email' },
    { icon: MessageSquare, label: 'Messages',              value: 'Email' },
    { icon: Megaphone,     label: 'Announcements',         value: 'Email'       },
    { icon: UserCheck,     label: isTutor ? 'Student Updates' : 'Tutor Updates', value: 'Email' },
  ]

  // ── Handlers ───────────────────────────────────────────────

  const handlePasswordUpdate = async () => {
    if (!pwForm.current_password) { setPwError('Enter your current password.'); return }
    if (!pwForm.password)         { setPwError('Enter a new password.'); return }
    if (pwForm.password !== pwForm.password_confirmation) { setPwError('Passwords do not match.'); return }
    setPwError(''); setPwLoading(true)
    try {
      await updatePassword(pwForm)
      setPwSuccess(true)
      setPwForm({ current_password: '', password: '', password_confirmation: '' })
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err) {
      setPwError(err?.response?.data?.message || 'Failed to update password.')
    } finally { setPwLoading(false) }
  }

  const handleDeleteAccount = async () => {
    if (!delPassword) { setDelError('Please enter your password to confirm.'); return }
    setDeleting(true); setDelError('')
    try {
      await deleteAccount(delPassword)
      clearAuth()
      navigate('/login')
    } catch (err) {
      setDelError(err?.response?.data?.message || 'Failed to delete account. Please try again.')
      setDeleting(false)
    }
  }

  const handleProfileSave = async () => {
    if (!profileForm.name.trim()) { setProfileError('Name cannot be empty.'); return }
    setProfileError(''); setProfileLoading(true)
    try {
      const res = await updateProfile({ name: profileForm.name, bio: profileForm.bio })
      const updated = { ...user, name: profileForm.name, bio: profileForm.bio }
      saveAuth(getToken(), updated)
      setUser(updated)
      setEditingProfile(false)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      setProfileError(err?.response?.data?.message || 'Failed to update profile.')
    } finally { setProfileLoading(false) }
  }

  const handleEmailSave = async () => {
    if (!emailForm.email.trim())           { setEmailError('Enter a new email address.'); return }
    if (!emailForm.current_password.trim()) { setEmailError('Enter your current password.'); return }
    setEmailError(''); setEmailLoading(true)
    try {
      await updateProfile({ email: emailForm.email, current_password: emailForm.current_password })
      const updated = { ...user, email: emailForm.email }
      saveAuth(getToken(), updated)
      setUser(updated)
      setEditingEmail(false)
      setEmailForm({ email: '', current_password: '' })
      setEmailSuccess(true)
      setTimeout(() => setEmailSuccess(false), 3000)
    } catch (err) {
      setEmailError(err?.response?.data?.message || 'Failed to update email.')
    } finally { setEmailLoading(false) }
  }

  // ── Tab navigation path map ────────────────────────────────
  const pathMap = {
    Account:       base,
    Notifications: `${base}/notifications`,
    Privacy:       `${base}/privacy`,
    Preferences:   `${base}/preferences`,
    Appearance:    `${base}/appearance`,
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .set-wrap * { box-sizing: border-box; }
        .set-wrap { font-family: 'DM Sans', sans-serif; color: #1E1B4B; display: flex; gap: 24px; align-items: flex-start; }
        .set-main { flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .set-right { width: 256px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
        .set-tab { padding: 8px 2px; font-size: 14px; font-weight: 600; color: #9CA3AF; cursor: pointer; border: none; border-bottom: 2.5px solid transparent; background: none; font-family: 'DM Sans', sans-serif; transition: color .15s; white-space: nowrap; }
        .set-tab.active { color: #7C3AED; border-bottom-color: #7C3AED; }
        .set-tab:hover { color: #7C3AED; }
        .set-row { display: flex; align-items: center; gap: 16px; padding: 18px 22px; border-bottom: 1px solid #F8F9FB; transition: background .12s; }
        .set-row:last-child { border-bottom: none; }
        .set-row:hover { background: #FAFAFA; }
        .set-input { width: 100%; padding: 10px 14px; border: 1.5px solid #E5E7EB; border-radius: 10px; font-size: 14px; color: #374151; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color .15s; }
        .set-input:focus { border-color: #7C3AED; }
        .notif-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid #F8F9FB; font-size: 13px; }
        .notif-row:last-child { border-bottom: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="set-wrap">
        <div className="set-main">
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Settings</h1>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Manage your account settings and preferences.</p>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #F0F0F4' }}>
            {TABS.map(t => (
              <button key={t} className={`set-tab${activeTab === t ? ' active' : ''}`}
                onClick={() => navigate(pathMap[t])}>
                {t}
              </button>
            ))}
          </div>

          {/* ── Account Tab ─────────────────────────────────── */}
          {activeTab === 'Account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Success banners */}
              {profileSuccess && (
                <div style={{ padding: '10px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, fontSize: 13.5, color: '#10B981', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <CheckCircle size={14} /> Profile updated successfully!
                </div>
              )}
              {emailSuccess && (
                <div style={{ padding: '10px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, fontSize: 13.5, color: '#10B981', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <CheckCircle size={14} /> Email address updated!
                </div>
              )}

              {/* Account info rows */}
              <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>

                {/* Profile row */}
                <div>
                  <div className="set-row" style={{ cursor: 'pointer' }}
                    onClick={() => { setEditingProfile(e => !e); setProfileError('') }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={22} color="#7C3AED" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1E1B4B', marginBottom: 3 }}>Account Information</div>
                      <div style={{ fontSize: 13, color: '#9CA3AF' }}>{user?.name} · {user?.email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Edit2 size={14} color="#9CA3AF" />
                      <ChevronRight size={16} color="#D1D5DB"
                        style={{ transform: editingProfile ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
                    </div>
                  </div>

                  {editingProfile && (
                    <div style={{ padding: '0 22px 18px', borderBottom: '1px solid #F8F9FB' }}>
                      {profileError && (
                        <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: '#EF4444', marginBottom: 12 }}>
                          {profileError}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 5 }}>Full Name</label>
                          <input className="set-input" value={profileForm.name} placeholder="Your name"
                            onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 5 }}>Bio</label>
                          <textarea className="set-input" value={profileForm.bio} placeholder="Short bio (optional)"
                            rows={2} onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                            style={{ resize: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={handleProfileSave} disabled={profileLoading} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', background: '#7C3AED', color: 'white', border: 'none',
                            borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: profileLoading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', opacity: profileLoading ? 0.7 : 1,
                          }}>
                            {profileLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                            {profileLoading ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button onClick={() => { setEditingProfile(false); setProfileForm({ name: user?.name || '', bio: user?.bio || '' }); setProfileError('') }} style={{
                            padding: '8px 14px', background: 'white', color: '#6B7280', border: '1px solid #E5E7EB',
                            borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 5,
                          }}>
                            <X size={13} /> Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Earnings row (tutor only) */}
                {isTutor && (
                  <div className="set-row">
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Wallet size={22} color="#10B981" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1E1B4B', marginBottom: 3 }}>Earnings</div>
                      <div style={{ fontSize: 13, color: '#9CA3AF' }}>View your earnings summary, history, and payment details.</div>
                    </div>
                    <ChevronRight size={16} color="#D1D5DB" />
                  </div>
                )}

                {/* Email row */}
                <div>
                  <div className="set-row" style={{ cursor: 'pointer' }}
                    onClick={() => { setEditingEmail(e => !e); setEmailError('') }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Mail size={22} color="#7C3AED" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1E1B4B', marginBottom: 3 }}>Email Address</div>
                      <div style={{ fontSize: 13, color: '#9CA3AF' }}>Update your email address used for notifications and login.</div>
                    </div>
                    <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500, marginRight: 6 }}>{user?.email}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Edit2 size={14} color="#9CA3AF" />
                      <ChevronRight size={16} color="#D1D5DB"
                        style={{ transform: editingEmail ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
                    </div>
                  </div>

                  {editingEmail && (
                    <div style={{ padding: '0 22px 18px', borderBottom: '1px solid #F8F9FB' }}>
                      {emailError && (
                        <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: '#EF4444', marginBottom: 12 }}>
                          {emailError}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 5 }}>New Email Address</label>
                          <input className="set-input" type="email" value={emailForm.email} placeholder="new@email.com"
                            onChange={e => setEmailForm(p => ({ ...p, email: e.target.value }))} />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 5 }}>Current Password</label>
                          <div style={{ position: 'relative' }}>
                            <input className="set-input" type={showEmailPw ? 'text' : 'password'} value={emailForm.current_password}
                              placeholder="Confirm with your password" onChange={e => setEmailForm(p => ({ ...p, current_password: e.target.value }))}
                              style={{ paddingRight: 40 }} />
                            <button onClick={() => setShowEmailPw(v => !v)}
                              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                              {showEmailPw ? <EyeOff size={15} color="#9CA3AF" /> : <Eye size={15} color="#9CA3AF" />}
                            </button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={handleEmailSave} disabled={emailLoading} style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', background: '#7C3AED', color: 'white', border: 'none',
                            borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: emailLoading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit', opacity: emailLoading ? 0.7 : 1,
                          }}>
                            {emailLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                            {emailLoading ? 'Updating...' : 'Update Email'}
                          </button>
                          <button onClick={() => { setEditingEmail(false); setEmailForm({ email: '', current_password: '' }); setEmailError('') }} style={{
                            padding: '8px 14px', background: 'white', color: '#6B7280', border: '1px solid #E5E7EB',
                            borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                            display: 'flex', alignItems: 'center', gap: 5,
                          }}>
                            <X size={13} /> Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2FA row */}
                <div className="set-row">
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Shield size={22} color="#7C3AED" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1E1B4B', marginBottom: 3 }}>Two-Factor Authentication</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>Add an extra layer of security to your account.</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: twoFA ? '#10B981' : '#9CA3AF', background: twoFA ? '#F0FDF4' : '#F9FAFB', border: `1px solid ${twoFA ? '#BBF7D0' : '#E5E7EB'}`, borderRadius: 20, padding: '3px 10px', marginRight: 10 }}>
                    {twoFA ? 'Enabled' : 'Disabled'}
                  </span>
                  <Toggle on={twoFA} onClick={() => setTwoFA(v => !v)} />
                </div>
              </div>

              {/* Password & Security */}
              <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={16} color="#7C3AED" />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Password & Security</span>
                </div>
                {pwError   && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, fontSize: 13.5, color: '#EF4444', marginBottom: 14 }}>{pwError}</div>}
                {pwSuccess && <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 9, fontSize: 13.5, color: '#10B981', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}><CheckCircle size={14} /> Password updated!</div>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { key: 'current_password',      label: 'Current Password'    },
                    { key: 'password',               label: 'New Password'        },
                    { key: 'password_confirmation',  label: 'Confirm New Password'},
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label style={{ fontSize: 12.5, fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: 6 }}>{label}</label>
                      <div style={{ position: 'relative' }}>
                        <input className="set-input" type={showPw[key] ? 'text' : 'password'} placeholder="••••••••"
                          value={pwForm[key]} onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))} style={{ paddingRight: 40 }} />
                        <button onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                          {showPw[key] ? <EyeOff size={15} color="#9CA3AF" /> : <Eye size={15} color="#9CA3AF" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={handlePasswordUpdate} disabled={pwLoading} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '11px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: 10,
                    fontSize: 14, fontWeight: 700, cursor: pwLoading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', opacity: pwLoading ? 0.7 : 1,
                  }}>
                    {pwLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                    {pwLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>

              {/* Delete Account */}
              <div style={{ background: 'white', border: '1.5px solid #FECACA', borderRadius: 16, padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Trash2 size={18} color="#EF4444" />
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#EF4444' }}>Delete Account</span>
                </div>
                <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16, lineHeight: 1.5 }}>
                  Permanently delete your account and all your data. This action cannot be undone.
                </p>
                {delError && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, fontSize: 13.5, color: '#EF4444', marginBottom: 14 }}>{delError}</div>}
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)} style={{ padding: '9px 18px', background: 'white', color: '#EF4444', border: '1.5px solid #EF4444', borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Delete Account
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ position: 'relative' }}>
                      <input className="set-input" type={showDelPw ? 'text' : 'password'}
                        placeholder="Enter your password to confirm" value={delPassword}
                        onChange={e => setDelPassword(e.target.value)} style={{ paddingRight: 40, borderColor: '#FECACA' }} />
                      <button onClick={() => setShowDelPw(v => !v)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        {showDelPw ? <EyeOff size={15} color="#9CA3AF" /> : <Eye size={15} color="#9CA3AF" />}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={handleDeleteAccount} disabled={deleting} style={{ padding: '9px 18px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: deleting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {deleting && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                        {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
                      </button>
                      <button onClick={() => { setConfirmDelete(false); setDelPassword(''); setDelError('') }} style={{ padding: '9px 18px', background: 'white', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Notifications Tab (basic toggles — full page at /settings/notifications) ── */}
          {activeTab === 'Notifications' && (
            <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 22px', borderBottom: '1px solid #F8F9FB', fontWeight: 700, fontSize: 15, color: '#1E1B4B' }}>Notification Channels</div>
              {[
                { key: 'email',     label: 'Email Notifications',   desc: 'Receive notifications via email'              },
                { key: 'marketing', label: 'Marketing Emails',      desc: 'Receive tips, updates and promotional content' },
              ].map(({ key, label, desc }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 22px', borderBottom: '1px solid #F8F9FB' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1E1B4B' }}>{label}</div>
                    <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 2 }}>{desc}</div>
                  </div>
                  <Toggle on={notifToggles[key]} onClick={() => setNotifToggles(p => ({ ...p, [key]: !p[key] }))} />
                </div>
              ))}
            </div>
          )}

          {/* ── Privacy Tab ─────────────────────────────────── */}
          {activeTab === 'Privacy' && (
            <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>
              <div className="set-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1E1B4B' }}>Profile Visibility</div>
                  <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 2 }}>Control who can see your profile.</div>
                </div>
                <select value={privVisibility} onChange={e => setPrivVisibility(e.target.value)}
                  style={{ padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                  {['Everyone', 'Matches Only', 'Hidden'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="set-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1E1B4B' }}>Online Status</div>
                  <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 2 }}>Show when you are online to others.</div>
                </div>
                <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500, marginRight: 10 }}>{privOnline ? 'Visible' : 'Hidden'}</span>
                <Toggle on={privOnline} onClick={() => setPrivOnline(v => !v)} />
              </div>
              <div className="set-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1E1B4B' }}>{isTutor ? 'Session History' : 'Study History'}</div>
                  <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 2 }}>{isTutor ? 'Allow students to see your session history.' : 'Allow tutors to see your study history.'}</div>
                </div>
                <select value={privHistory} onChange={e => setPrivHistory(e.target.value)}
                  style={{ padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                  {['Everyone', 'Tutors only', 'Nobody'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="set-row">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1E1B4B' }}>Data Download</div>
                  <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 2 }}>Download a copy of all your account data.</div>
                </div>
                <button
                  onClick={() => alert('Your data export request has been received. You will receive a confirmation email shortly.')}
                  style={{ padding: '7px 16px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>
                  Request Export
                </button>
              </div>
            </div>
          )}

          {/* ── Preferences Tab ─────────────────────────────── */}
          {activeTab === 'Preferences' && (
            <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>
              {[
                { title: 'Language',          desc: 'Choose your preferred language.',          state: prefLang,     set: setPrefLang,     opts: ['English (US)', 'Filipino', 'Spanish', 'French', 'Japanese'] },
                { title: 'Timezone',          desc: 'Set your local timezone for scheduling.',  state: prefTz,       set: setPrefTz,       opts: ['UTC+8 (PHT)', 'UTC+0 (GMT)', 'UTC+9 (JST)', 'UTC-5 (EST)', 'UTC-8 (PST)', 'UTC+1 (CET)'] },
                { title: 'Session Reminders', desc: 'How early to remind you before sessions.', state: prefReminder, set: setPrefReminder, opts: ['5 minutes', '10 minutes', '15 minutes', '30 minutes', '1 hour'] },
                { title: 'Default Session Type', desc: 'Your preferred study session format.',  state: prefSession,  set: setPrefSession,  opts: ['Online', 'In-Person', 'Either'] },
              ].map((r, i) => (
                <div key={i} className="set-row">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1E1B4B' }}>{r.title}</div>
                    <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 2 }}>{r.desc}</div>
                  </div>
                  <select value={r.state} onChange={e => r.set(e.target.value)}
                    style={{ padding: '7px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
                    {r.opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* ── Appearance Tab ──────────────────────────────── */}
          {activeTab === 'Appearance' && (
            <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #F8F9FB' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 14 }}>Theme</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { id: 'light',  emoji: '☀️', label: 'Light'  },
                    { id: 'dark',   emoji: '🌙', label: 'Dark'   },
                    { id: 'system', emoji: '💻', label: 'System' },
                  ].map(t => (
                    <div key={t.id} onClick={() => setTheme(t.id)} style={{ flex: 1, padding: '14px', cursor: 'pointer', textAlign: 'center', border: `2px solid ${theme === t.id ? '#7C3AED' : '#E5E7EB'}`, borderRadius: 12, background: theme === t.id ? '#F3F0FF' : 'white', transition: 'all .15s' }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>{t.emoji}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: theme === t.id ? '#7C3AED' : '#374151' }}>{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: '18px 22px' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1E1B4B', marginBottom: 14 }}>Accent Color</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['#7C3AED','#3B82F6','#14B8A6','#22C55E','#F59E0B','#EC4899','#EF4444'].map(c => (
                    <div key={c} onClick={() => setAccentColor(c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer', border: accentColor === c ? '3px solid white' : '3px solid transparent', outline: accentColor === c ? `2px solid ${c}` : 'none', transition: 'outline .15s' }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel ─────────────────────────────────────── */}
        <div className="set-right">
          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: twoFA ? '#F0FDF4' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={22} color={twoFA ? '#10B981' : '#9CA3AF'} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1E1B4B' }}>Account Security</div>
                <div style={{ fontSize: 12.5, color: twoFA ? '#10B981' : '#F59E0B', fontWeight: 600, marginTop: 2 }}>
                  {twoFA ? 'Your account is secure' : 'Enable 2FA for better security'}
                </div>
              </div>
            </div>
            {['Password is strong', 'Email is verified', ...(twoFA ? ['Two-factor auth enabled'] : [])].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', marginBottom: 8 }}>
                <CheckCircle size={15} color="#10B981" fill="#F0FDF4" /> {item}
              </div>
            ))}
          </div>

          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bell size={17} color="#7C3AED" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14.5, color: '#1E1B4B' }}>Notification Preferences</span>
            </div>
            <div style={{ fontSize: 12.5, color: '#9CA3AF', marginBottom: 14 }}>You'll be notified about:</div>
            {NOTIF_ROWS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="notif-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151', fontWeight: 500 }}>
                  <Icon size={13} color="#9CA3AF" /> {label}
                </div>
                <span style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', border: '1px solid #F0F0F4', borderRadius: 16, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HelpCircle size={17} color="#7C3AED" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14.5, color: '#1E1B4B' }}>Need Help?</span>
            </div>
            <div style={{ fontSize: 12.5, color: '#9CA3AF', marginBottom: 12, lineHeight: 1.5 }}>We're here to help you with any issues.</div>
            <button onClick={() => navigate(isTutor ? '/tutor/help' : '/student/help')} style={{ background: 'none', border: 'none', color: '#7C3AED', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              Visit Help Center <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
