import { useState } from 'react'

export default function SettingsPage() {
  const [maintenanceMode, setMaintenanceMode] =
    useState(false)

  const [registrationsOpen, setRegistrationsOpen] =
    useState(true)

  return (
    <div>
      <h1
        style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#111827',
          marginBottom: '30px',
        }}
      >
        Platform Settings
      </h1>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Maintenance Mode */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e5e7eb',
            padding: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '6px',
                }}
              >
                Maintenance Mode
              </h2>

              <p
                style={{
                  color: '#6b7280',
                }}
              >
                Temporarily disable the
                platform for maintenance.
              </p>
            </div>

            <button
              onClick={() =>
                setMaintenanceMode(
                  !maintenanceMode
                )
              }
              style={{
                background: maintenanceMode
                  ? '#ef4444'
                  : '#22c55e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding:
                  '12px 18px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              {maintenanceMode
                ? 'Enabled'
                : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Registrations */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e5e7eb',
            padding: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '6px',
                }}
              >
                User Registrations
              </h2>

              <p
                style={{
                  color: '#6b7280',
                }}
              >
                Allow or disable new
                student/tutor registrations.
              </p>
            </div>

            <button
              onClick={() =>
                setRegistrationsOpen(
                  !registrationsOpen
                )
              }
              style={{
                background:
                  registrationsOpen
                    ? '#22c55e'
                    : '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding:
                  '12px 18px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              {registrationsOpen
                ? 'Open'
                : 'Closed'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            border:
              '1px solid #fecaca',
            padding: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#dc2626',
              marginBottom: '12px',
            }}
          >
            Danger Zone
          </h2>

          <p
            style={{
              color: '#6b7280',
              marginBottom: '20px',
            }}
          >
            Critical actions that affect
            the entire platform.
          </p>

          <button
            style={{
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 18px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Clear System Cache
          </button>
        </div>
      </div>
    </div>
  )
}