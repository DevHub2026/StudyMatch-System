export default function UsersPage() {
  const users = [
    {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'student',
      status: 'active',
    },
    {
      name: 'Sarah Miller',
      email: 'sarah@example.com',
      role: 'tutor',
      status: 'pending',
    },
    {
      name: 'Michael Smith',
      email: 'michael@example.com',
      role: 'student',
      status: 'suspended',
    },
  ]

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
        User Management
      </h1>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '2fr 2fr 1fr 1fr 1fr',
            padding: '18px 24px',
            background: '#f9fafb',
            fontWeight: '600',
            color: '#374151',
          }}
        >
          <div>Name</div>
          <div>Email</div>
          <div>Role</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {/* Users */}
        {users.map((user, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns:
                '2fr 2fr 1fr 1fr 1fr',
              padding: '18px 24px',
              borderTop:
                '1px solid #f3f4f6',
              alignItems: 'center',
            }}
          >
            <div>{user.name}</div>

            <div>{user.email}</div>

            <div
              style={{
                textTransform: 'capitalize',
              }}
            >
              {user.role}
            </div>

            <div>
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background:
                    user.status === 'active'
                      ? '#dcfce7'
                      : user.status ===
                        'pending'
                      ? '#fef3c7'
                      : '#fee2e2',
                  color:
                    user.status === 'active'
                      ? '#166534'
                      : user.status ===
                        'pending'
                      ? '#92400e'
                      : '#991b1b',
                }}
              >
                {user.status}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '10px',
              }}
            >
              <button
                style={{
                  background: '#f3f0ff',
                  color: '#6d5dfc',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                View
              </button>

              <button
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Suspend
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}