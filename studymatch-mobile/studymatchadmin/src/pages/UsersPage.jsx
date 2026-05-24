import { useEffect, useState } from 'react'
import { getUsers, deleteUser, suspendUser } from '../api/user'
import { assignRole, revokeRole } from '../api/roles'

const Badge = ({ text, color }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
    {text}
  </span>
)

const getRoleBadge = (roles) => {
  if (!roles || roles.length === 0)
    return <Badge text="student" color="bg-gray-100 text-gray-600" />
  const role = roles[0]?.name ?? roles[0]
  const colors = {
    super_admin: 'bg-purple-100 text-purple-700',
    admin:       'bg-indigo-100 text-indigo-700',
    student:     'bg-gray-100 text-gray-600',
  }
  return <Badge text={role} color={colors[role] ?? 'bg-gray-100 text-gray-600'} />
}

export default function UsersPage() {
  const [users, setUsers]         = useState([])
  const [meta, setMeta]           = useState(null)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [selected, setSelected]   = useState(null)
  const [actionMsg, setActionMsg] = useState('')

  const fetchUsers = async (q = search, p = page) => {
    setLoading(true)
    setError('')
    try {
      const res = await getUsers({ search: q, page: p })
      setUsers(res.data.data)
      setMeta(res.data)
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [page])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchUsers(search, 1)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await deleteUser(id)
      setActionMsg('User deleted successfully.')
      setSelected(null)
      fetchUsers()
    } catch {
      setActionMsg('Failed to delete user.')
    }
  }

  const handleSuspend = async (id) => {
    if (!confirm('Suspend this user?')) return
    try {
      await suspendUser(id)
      setActionMsg('User suspended successfully.')
      fetchUsers()
    } catch {
      setActionMsg('Failed to suspend user.')
    }
  }

  const handleAssignRole = async (userId, role) => {
    try {
      await assignRole(userId, role)
      setActionMsg(`Role "${role}" assigned.`)
      fetchUsers()
    } catch {
      setActionMsg('Failed to assign role.')
    }
  }

  const handleRevokeRole = async (userId, role) => {
    try {
      await revokeRole(userId, role)
      setActionMsg(`Role "${role}" revoked.`)
      fetchUsers()
    } catch {
      setActionMsg('Failed to revoke role.')
    }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage all registered users on the platform
          </p>
        </div>
        {meta && (
          <span className="text-sm text-gray-500">
            {meta.total} total users
          </span>
        )}
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

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setPage(1); fetchUsers('', 1) }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">ID</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Name</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Email</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Role</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Joined</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr
                  key={user.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3 text-gray-400">{user.id}</td>
                  <td className="px-5 py-3 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      {user.name}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{user.email}</td>
                  <td className="px-5 py-3">{getRoleBadge(user.roles)}</td>
                  <td className="px-5 py-3 text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSelected(user)}
                      className="text-indigo-600 hover:text-indigo-800 font-medium mr-3"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleSuspend(user.id)}
                      className="text-amber-600 hover:text-amber-800 font-medium mr-3"
                    >
                      Suspend
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {meta.current_page} of {meta.last_page}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={meta.current_page === 1}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
              disabled={meta.current_page === meta.last_page}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* User detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">User Details</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Avatar and name */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold">
                {selected.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-lg">{selected.name}</p>
                <p className="text-gray-500 text-sm">{selected.email}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-5 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">User ID</span>
                <span className="font-medium text-gray-700">{selected.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Role</span>
                <span>{getRoleBadge(selected.roles)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Joined</span>
                <span className="font-medium text-gray-700">
                  {new Date(selected.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Verified</span>
                <span className={`font-medium ${selected.email_verified_at ? 'text-green-600' : 'text-red-500'}`}>
                  {selected.email_verified_at ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* Role management */}
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Role Management
              </p>
              <div className="flex gap-2 flex-wrap">
                {['admin', 'super_admin'].map(role => (
                  <button
                    key={role}
                    onClick={() => handleAssignRole(selected.id, role)}
                    className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    + Assign {role}
                  </button>
                ))}
                {selected.roles?.map(r => {
                  const roleName = r.name ?? r
                  return (
                    <button
                      key={roleName}
                      onClick={() => handleRevokeRole(selected.id, roleName)}
                      className="px-3 py-1.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      - Revoke {roleName}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleSuspend(selected.id)}
                className="flex-1 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium py-2 rounded-lg hover:bg-amber-100 transition-colors"
              >
                Suspend User
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                className="flex-1 bg-red-50 border border-red-200 text-red-600 text-sm font-medium py-2 rounded-lg hover:bg-red-100 transition-colors"
              >
                Delete User
              </button>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}