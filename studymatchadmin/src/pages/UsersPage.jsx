import { useEffect, useState, useRef } from 'react'
import { getUsers, deleteUser, suspendUser, unsuspendUser, verifyUserEmail } from '../api/user'
import {
  Search, Users, GraduationCap, UserCheck, ShieldCheck,
  CheckCircle, XCircle, Loader2, X, AlertCircle,
  MailCheck, HelpCircle,
} from 'lucide-react'

// ── Badges ────────────────────────────────────────────────────────────────────

const RoleBadge = ({ role }) => {
  const cfg = {
    admin:   { cls: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Admin'   },
    tutor:   { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Tutor' },
    student: { cls: 'bg-blue-50 text-blue-700 border-blue-200',        label: 'Student' },
  }
  const { cls, label } = cfg[role] ?? { cls: 'bg-gray-100 text-gray-500 border-gray-200', label: role }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  )
}

const StatusDot = ({ suspended }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${suspended ? 'text-red-500' : 'text-emerald-600'}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${suspended ? 'bg-red-500' : 'bg-emerald-500'}`} />
    {suspended ? 'Suspended' : 'Active'}
  </span>
)

const VerifiedBadge = ({ verified }) =>
  verified ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
      <CheckCircle size={12} /> Yes
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
      <AlertCircle size={12} /> Pending
    </span>
  )

const ROLE_TABS = [
  { key: '',        label: 'All Users', icon: Users,         },
  { key: 'student', label: 'Students',  icon: GraduationCap  },
  { key: 'tutor',   label: 'Tutors',    icon: UserCheck      },
  { key: 'admin',   label: 'Admins',    icon: ShieldCheck    },
]

// ── Why email might be unverified ─────────────────────────────────────────────
const VERIFY_REASON = `Email verification requires the user to enter a 6-digit OTP sent to their inbox after registration. Users who:
• Registered but skipped the OTP step
• Registered via a seeded/test account
• Had their OTP expire before entering it
…will show "Pending" here. They can still use the platform but admin can manually verify them.`

export default function UsersPage() {
  const [users,      setUsers]      = useState([])
  const [meta,       setMeta]       = useState(null)
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page,       setPage]       = useState(1)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [selected,   setSelected]   = useState(null)
  const [actionMsg,  setActionMsg]  = useState('')
  const [processing, setProcessing] = useState(false)
  const [showVerifyInfo, setShowVerifyInfo] = useState(false)

  // Debounce ref
  const debounceRef = useRef(null)

  const fetchUsers = async (q = search, p = page, r = roleFilter) => {
    setLoading(true); setError('')
    try {
      const res = await getUsers({ search: q || undefined, page: p, role: r || undefined })
      setUsers(res.data.data)
      setMeta(res.data)
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  // Initial load + page changes
  useEffect(() => { fetchUsers(search, page, roleFilter) }, [page])

  // Live search — debounce 350ms
  const handleSearchChange = (val) => {
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      fetchUsers(val, 1, roleFilter)
    }, 350)
  }

  const handleRoleFilter = (role) => {
    setRoleFilter(role); setPage(1)
    fetchUsers(search, 1, role)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return
    setProcessing(true)
    try {
      await deleteUser(id)
      setActionMsg('User deleted.')
      setSelected(null); fetchUsers()
    } catch { setActionMsg('Failed to delete user.') }
    finally { setProcessing(false) }
  }

  const handleSuspend = async (id) => {
    if (!window.confirm('Suspend this user? They will lose access to the platform.')) return
    setProcessing(true)
    try {
      await suspendUser(id)
      setActionMsg('User suspended.')
      setSelected(null); fetchUsers()
    } catch { setActionMsg('Failed to suspend user.') }
    finally { setProcessing(false) }
  }

  const handleUnsuspend = async (id) => {
    setProcessing(true)
    try {
      await unsuspendUser(id)
      setActionMsg('User reinstated.')
      setSelected(null); fetchUsers()
    } catch { setActionMsg('Failed to reinstate user.') }
    finally { setProcessing(false) }
  }

  const handleVerifyEmail = async (id) => {
    setProcessing(true)
    try {
      await verifyUserEmail(id)
      setActionMsg('Email verified successfully.')
      // Update local state so modal reflects change immediately
      setSelected(s => s ? { ...s, email_verified_at: new Date().toISOString() } : s)
      fetchUsers()
    } catch { setActionMsg('Failed to verify email.') }
    finally { setProcessing(false) }
  }

  return (
    <div className="space-y-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all registered users on the platform.</p>
        </div>
        {meta && (
          <span className="text-sm text-gray-500 bg-white border border-gray-100 rounded-lg px-3 py-1.5 shadow-sm">
            {meta.total} total users
          </span>
        )}
      </div>

      {/* Toast */}
      {actionMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
          <CheckCircle size={15} /> {actionMsg}
          <button onClick={() => setActionMsg('')} className="ml-auto text-green-500 hover:text-green-700 font-semibold text-xs">Dismiss</button>
        </div>
      )}

      {/* Role filter tabs */}
      <div className="flex gap-0 border-b border-gray-100">
        {ROLE_TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.key} onClick={() => handleRoleFilter(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                roleFilter === tab.key ? 'text-indigo-600 border-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              <Icon size={14} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Live search bar */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search by name or email — results appear as you type…"
          className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
        />
        {loading && search && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" />
        )}
        {!loading && search && (
          <button onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">User</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Role</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">
                <div className="flex items-center gap-1.5">
                  Email Verified
                  <button onClick={() => setShowVerifyInfo(v => !v)} className="text-gray-400 hover:text-gray-600">
                    <HelpCircle size={13} />
                  </button>
                </div>
              </th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Joined</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !users.length ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <Loader2 size={24} className="animate-spin text-indigo-400 mx-auto" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-gray-400">
                  <Users size={28} className="mx-auto mb-2 text-gray-300" />
                  {search ? `No users matching "${search}"` : 'No users found.'}
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}
                  className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${user.suspended_at ? 'bg-red-50/20' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        user.role === 'tutor' ? 'bg-emerald-100 text-emerald-700' :
                        user.role === 'admin' || user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{user.name}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><RoleBadge role={user.role} /></td>
                  <td className="px-5 py-3.5"><StatusDot suspended={!!user.suspended_at} /></td>
                  <td className="px-5 py-3.5"><VerifiedBadge verified={!!user.email_verified_at} /></td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelected(user)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs">View</button>
                      {user.suspended_at ? (
                        <button onClick={() => handleUnsuspend(user.id)} disabled={processing}
                          className="text-emerald-600 hover:text-emerald-800 font-semibold text-xs disabled:opacity-40">Reinstate</button>
                      ) : (
                        <button onClick={() => handleSuspend(user.id)} disabled={processing}
                          className="text-amber-600 hover:text-amber-800 font-semibold text-xs disabled:opacity-40">Suspend</button>
                      )}
                      <button onClick={() => handleDelete(user.id)} disabled={processing}
                        className="text-red-500 hover:text-red-700 font-semibold text-xs disabled:opacity-40">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Why verified info tooltip */}
      {showVerifyInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 relative">
          <button onClick={() => setShowVerifyInfo(false)} className="absolute top-3 right-3 text-blue-400 hover:text-blue-600"><X size={14} /></button>
          <div className="font-semibold text-blue-800 mb-1 flex items-center gap-1.5"><HelpCircle size={13} /> About Email Verification</div>
          <p className="text-xs leading-relaxed whitespace-pre-line text-blue-600">{VERIFY_REASON}</p>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {meta.current_page} of {meta.last_page} · {meta.total} total</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.current_page === 1}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">← Previous</button>
            <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={meta.current_page === meta.last_page}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Next →</button>
          </div>
        </div>
      )}

      {/* User detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" style={{ fontFamily: "'DM Sans', sans-serif" }}>

            <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${
                selected.role === 'tutor' ? 'bg-emerald-100 text-emerald-700' :
                selected.role === 'admin' || selected.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {selected.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-gray-800 text-lg">{selected.name}</h2>
                  <RoleBadge role={selected.role} />
                </div>
                <p className="text-gray-400 text-sm">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-0">
              {[
                { label: 'User ID',          value: `#${selected.id}` },
                { label: 'Status',           value: <StatusDot suspended={!!selected.suspended_at} /> },
                { label: 'Profile Complete', value: selected.profile_completed
                    ? <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1"><CheckCircle size={12} /> Complete</span>
                    : <span className="text-xs font-semibold text-amber-500">Incomplete</span> },
                { label: 'Joined',           value: new Date(selected.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-semibold text-gray-700">{value}</span>
                </div>
              ))}

              {/* Email verification row — special because it has an action button */}
              <div className="flex justify-between items-center py-2.5 border-b border-gray-50">
                <span className="text-sm text-gray-500">Email Verified</span>
                <div className="flex items-center gap-2">
                  <VerifiedBadge verified={!!selected.email_verified_at} />
                  {!selected.email_verified_at && (
                    <button
                      onClick={() => handleVerifyEmail(selected.id)}
                      disabled={processing}
                      className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors">
                      {processing ? <Loader2 size={11} className="animate-spin" /> : <MailCheck size={11} />}
                      Verify Now
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Explanation for unverified */}
            {!selected.email_verified_at && (
              <div className="mx-6 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <div className="flex items-start gap-2 text-xs text-amber-700 leading-relaxed">
                  <AlertCircle size={13} className="mt-0.5 flex-shrink-0 text-amber-500" />
                  <span>
                    This user has not verified their email via the OTP sent during registration.
                    Click <strong>Verify Now</strong> to manually approve their email as an admin override.
                  </span>
                </div>
              </div>
            )}

            <div className="px-6 pb-5 flex gap-2">
              {selected.suspended_at ? (
                <button onClick={() => handleUnsuspend(selected.id)} disabled={processing}
                  className="flex-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors">
                  {processing ? 'Processing…' : 'Reinstate User'}
                </button>
              ) : (
                <button onClick={() => handleSuspend(selected.id)} disabled={processing}
                  className="flex-1 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors">
                  {processing ? 'Processing…' : 'Suspend User'}
                </button>
              )}
              <button onClick={() => handleDelete(selected.id)} disabled={processing}
                className="flex-1 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors">
                Delete User
              </button>
              <button onClick={() => setSelected(null)}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
