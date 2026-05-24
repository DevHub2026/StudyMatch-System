import { useEffect, useState } from 'react'
import api from '../api/axiosInstance'

const GroupBadge = ({ group }) => {
  const styles = {
    general:       'bg-indigo-50 text-indigo-600',
    security:      'bg-red-50 text-red-600',
    notifications: 'bg-amber-50 text-amber-600',
    features:      'bg-emerald-50 text-emerald-600',
    limits:        'bg-blue-50 text-blue-600',
  }
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[group] ?? 'bg-gray-100 text-gray-600'}`}>
      {group}
    </span>
  )
}

export default function SystemConfigPage() {
  const [configs, setConfigs]       = useState({})
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [actionMsg, setActionMsg]   = useState('')
  const [editing, setEditing]       = useState(null)
  const [editValue, setEditValue]   = useState('')
  const [saving, setSaving]         = useState(false)
  const [showAdd, setShowAdd]       = useState(false)
  const [newConfig, setNewConfig]   = useState({
    key:         '',
    value:       '',
    group:       'general',
    description: '',
  })
  const [adding, setAdding]         = useState(false)

  const fetchConfigs = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/admin/system-config')
      setConfigs(res.data)
    } catch {
      setError('Failed to load system configuration.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConfigs() }, [])

  const handleEdit = (config) => {
    setEditing(config.key)
    setEditValue(config.value ?? '')
  }

  const handleSave = async (key) => {
    setSaving(true)
    try {
      await api.put(`/admin/system-config/${key}`, { value: editValue })
      setActionMsg(`Configuration "${key}" updated successfully.`)
      setEditing(null)
      fetchConfigs()
    } catch {
      setActionMsg('Failed to update configuration.')
    } finally {
      setSaving(false)
    }
  }

  const handleAdd = async () => {
    if (!newConfig.key.trim() || !newConfig.value.trim()) return
    setAdding(true)
    try {
      await api.put(`/admin/system-config/${newConfig.key}`, {
        value:       newConfig.value,
        group:       newConfig.group,
        description: newConfig.description,
      })
      setActionMsg(`Configuration "${newConfig.key}" added successfully.`)
      setShowAdd(false)
      setNewConfig({ key: '', value: '', group: 'general', description: '' })
      fetchConfigs()
    } catch {
      setActionMsg('Failed to add configuration.')
    } finally {
      setAdding(false)
    }
  }

  const allConfigs = Object.values(configs).flat()

  const groups = [
    'general',
    'security',
    'notifications',
    'features',
    'limits',
  ]

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            System Configuration
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage platform settings and configuration values
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Config
        </button>
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-gray-400 text-sm">
            Loading system configuration...
          </p>
        </div>
      ) : allConfigs.length === 0 ? (

        /* Empty state */
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-400 text-sm mb-3">
            No configuration entries found.
          </p>
          <p className="text-gray-400 text-xs">
            Click "+ Add Config" to create your first entry.
          </p>
        </div>

      ) : (

        /* Config groups */
        <div className="space-y-4">
          {Object.entries(configs).map(([group, items]) => (
            <div
              key={group}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Group header */}
              <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-100">
                <GroupBadge group={group} />
                <span className="text-sm font-semibold text-gray-700">
                  {group.charAt(0).toUpperCase() + group.slice(1)} Settings
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {items.length} {items.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              {/* Config rows */}
              <div className="divide-y divide-gray-50">
                {items.map(config => (
                  <div
                    key={config.id}
                    className="px-5 py-4 flex items-start gap-4"
                  >

                    {/* Key + description */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-medium text-gray-800">
                        {config.key}
                      </p>
                      {config.description && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {config.description}
                        </p>
                      )}
                    </div>

                    {/* Value — edit inline */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {editing === config.key ? (
                        <>
                          <input
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="bg-gray-50 border border-indigo-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-48"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSave(config.key)
                              if (e.key === 'Escape') setEditing(null)
                            }}
                          />
                          <button
                            onClick={() => handleSave(config.key)}
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="text-gray-400 hover:text-gray-600 text-xs px-2 py-1.5"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-gray-700 font-mono bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg min-w-24 text-right">
                            {config.value ?? '—'}
                          </span>
                          <button
                            onClick={() => handleEdit(config)}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                          >
                            Edit
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add config modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">
                Add Configuration
              </h2>
              <button
                onClick={() => setShowAdd(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">

              {/* Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Key
                </label>
                <input
                  type="text"
                  value={newConfig.key}
                  onChange={e => setNewConfig({ ...newConfig, key: e.target.value })}
                  placeholder="e.g. max_sessions_per_user"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              {/* Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Value
                </label>
                <input
                  type="text"
                  value={newConfig.value}
                  onChange={e => setNewConfig({ ...newConfig, value: e.target.value })}
                  placeholder="e.g. 5"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              {/* Group */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Group
                </label>
                <select
                  value={newConfig.group}
                  onChange={e => setNewConfig({ ...newConfig, group: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                >
                  {groups.map(g => (
                    <option key={g} value={g}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newConfig.description}
                  onChange={e => setNewConfig({ ...newConfig, description: e.target.value })}
                  placeholder="What does this setting control?"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                />
              </div>

            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAdd}
                disabled={adding || !newConfig.key.trim() || !newConfig.value.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {adding ? 'Adding...' : 'Add Configuration'}
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}