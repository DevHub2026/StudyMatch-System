import { useEffect, useState } from 'react'
import api from '../api/axiosInstance'

const TypeBadge = ({ type }) => {
  const styles = {
    info:    'bg-blue-50 text-blue-600',
    warning: 'bg-amber-50 text-amber-600',
    success: 'bg-emerald-50 text-emerald-600',
    error:   'bg-red-50 text-red-600',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type] ?? 'bg-gray-100 text-gray-600'}`}>
      {type}
    </span>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [meta, setMeta]                   = useState(null)
  const [page, setPage]                   = useState(1)
  const [filter, setFilter]               = useState('')
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [actionMsg, setActionMsg]         = useState('')
  const [marking, setMarking]             = useState(false)

  const fetchNotifications = async (p = page, f = filter) => {
    setLoading(true)
    setError('')
    try {
      const params = { page: p }
      if (f === 'unread') params.is_read = false
      if (f === 'read')   params.is_read = true
      const res = await api.get('/admin/notifications', { params })
      setNotifications(res.data.data)
      setMeta(res.data)
    } catch {
      setError('Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifications() }, [page])

  const handleFilter = (val) => {
    setFilter(val)
    setPage(1)
    fetchNotifications(1, val)
  }

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/admin/notifications/${id}/read`)
      setActionMsg('Notification marked as read.')
      fetchNotifications()
    } catch {
      setActionMsg('Failed to mark notification.')
    }
  }

  const handleMarkAllRead = async () => {
    setMarking(true)
    try {
      await api.put('/admin/notifications/mark-all-read')
      setActionMsg('All notifications marked as read.')
      fetchNotifications()
    } catch {
      setActionMsg('Failed to mark all notifications.')
    } finally {
      setMarking(false)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString() : '—'

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Notification Center
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitor all platform notifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="bg-red-50 text-red-600 border border-red-100 text-sm px-3 py-1 rounded-lg">
              {unreadCount} unread
            </span>
          )}
          <button
            onClick={handleMarkAllRead}
            disabled={marking}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {marking ? 'Marking...' : 'Mark All Read'}
          </button>
        </div>
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

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { val: '',       label: 'All'    },
          { val: 'unread', label: 'Unread' },
          { val: 'read',   label: 'Read'   },
        ].map(f => (
          <button
            key={f.val}
            onClick={() => handleFilter(f.val)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              filter === f.val
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Notifications list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-400 text-sm">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-400 text-sm">No notifications found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`bg-white rounded-xl border shadow-sm px-5 py-4 flex items-start justify-between gap-4 transition-colors ${
                !n.is_read
                  ? 'border-indigo-200 bg-indigo-50/30'
                  : 'border-gray-100'
              }`}
            >
              {/* Left — unread dot + content */}
              <div className="flex items-start gap-3 flex-1">
                <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                  !n.is_read ? 'bg-indigo-500' : 'bg-gray-200'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-sm font-semibold ${
                      !n.is_read ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {n.title}
                    </p>
                    <TypeBadge type={n.type} />
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-xs text-gray-400">
                      {formatDate(n.created_at)}
                    </p>
                    {n.user && (
                      <p className="text-xs text-gray-400">
                        · {n.user.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right — mark read button */}
              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors flex-shrink-0"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}

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
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
              disabled={meta.current_page === meta.last_page}
              className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  )
}