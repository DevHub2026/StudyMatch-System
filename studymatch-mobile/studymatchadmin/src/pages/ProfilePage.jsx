import { useEffect, useState } from 'react'
import api from '../api/axiosInstance'
import { getUser, saveAuth, getToken } from '../store/authStore'

export default function ProfilePage() {
  const currentUser = getUser()

  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [saving, setSaving]       = useState(false)

  // Profile form
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')

  // Password form
  const [currentPassword, setCurrentPassword]   = useState('')
  const [newPassword, setNewPassword]           = useState('')
  const [confirmPassword, setConfirmPassword]   = useState('')
  const [passwordError, setPasswordError]       = useState('')
  const [savingPassword, setSavingPassword]     = useState(false)

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/me')
      setProfile(res.data)
      setName(res.data.name)
      setEmail(res.data.email)
    } catch {
      setError('Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfile() }, [])

  const handleSaveProfile = async () => {
    if (!name.trim() || !email.trim()) return
    setSaving(true)
    setActionMsg('')
    try {
      const res = await api.put(`/admin/users/${profile.id}`, { name, email })
      // Update stored user info
      saveAuth(getToken(), {
        ...currentUser,
        name:  res.data.user.name,
        email: res.data.user.email,
      })
      setActionMsg('Profile updated successfully.')
      fetchProfile()
    } catch {
      setActionMsg('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    setSavingPassword(true)
    try {
      await api.put(`/admin/users/${profile.id}`, {
        password:              newPassword,
        password_confirmation: confirmPassword,
      })
      setActionMsg('Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setPasswordError('Failed to change password. Check your current password.')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-sm">Loading profile...</p>
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
      {error}
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Profile</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your account information and password
        </p>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          {actionMsg}
          <button
            onClick={() => setActionMsg('')}
            className="ml-3 text-green-500 hover:text-green-700 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">

        {/* Avatar section */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
          <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
            {profile?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {profile?.name}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {profile?.email}
            </p>
            <div className="flex gap-2 mt-2">
              {profile?.roles?.map(role => (
                <span
                  key={role}
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    role === 'super_admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Profile stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">
              {profile?.roles?.length ?? 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Roles assigned</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">
              {profile?.permissions?.length ?? 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Permissions</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm font-bold text-indigo-600">
              {profile?.id ? `#${profile.id}` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Admin ID</p>
          </div>
        </div>

        {/* Edit profile form */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Edit Profile Information
          </h3>
          <div className="space-y-4">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
              />
            </div>

            {/* Save button */}
            <button
              onClick={handleSaveProfile}
              disabled={saving || !name.trim() || !email.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

          </div>
        </div>

      </div>

      {/* Change password card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Change Password
        </h3>

        {passwordError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
            {passwordError}
          </div>
        )}

        <div className="space-y-4">

          {/* Current password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          {/* Password strength indicator */}
          {newPassword.length > 0 && (
            <div>
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map(level => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      newPassword.length >= level * 3
                        ? level <= 1
                          ? 'bg-red-400'
                          : level <= 2
                          ? 'bg-amber-400'
                          : level <= 3
                          ? 'bg-blue-400'
                          : 'bg-emerald-400'
                        : 'bg-gray-100'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {newPassword.length < 4  && 'Too short'}
                {newPassword.length >= 4  && newPassword.length < 7  && 'Weak'}
                {newPassword.length >= 7  && newPassword.length < 10 && 'Good'}
                {newPassword.length >= 10 && 'Strong'}
              </p>
            </div>
          )}

          {/* Save password button */}
          <button
            onClick={handleChangePassword}
            disabled={savingPassword}
            className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            {savingPassword ? 'Changing...' : 'Change Password'}
          </button>

        </div>
      </div>

      {/* Account info card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Account Information
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Admin ID</span>
            <span className="font-medium text-gray-700">#{profile?.id}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Roles</span>
            <div className="flex gap-1">
              {profile?.roles?.map(role => (
                <span
                  key={role}
                  className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-xs font-medium"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Permissions</span>
            <span className="font-medium text-gray-700">
              {profile?.permissions?.length ?? 0} granted
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Email verified</span>
            <span className={`font-medium ${
              profile?.email_verified_at
                ? 'text-emerald-600'
                : 'text-red-500'
            }`}>
              {profile?.email_verified_at ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}