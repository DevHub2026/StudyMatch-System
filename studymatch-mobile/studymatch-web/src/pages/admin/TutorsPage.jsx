export default function TutorsPage() {
  const tutors = [
    {
      name: 'Jessica Parker',
      email: 'jessica@example.com',
      specialization: 'Mathematics',
      status: 'pending',
    },
    {
      name: 'Daniel Carter',
      email: 'daniel@example.com',
      specialization: 'Physics',
      status: 'verified',
    },
    {
      name: 'Sophie Bennett',
      email: 'sophie@example.com',
      specialization: 'Programming',
      status: 'pending',
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
        Tutor Verification
      </h1>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '2fr 2fr 2fr 1fr 1.5fr',
            padding: '18px 24px',
            background: '#f9fafb',
            fontWeight: '600',
            color: '#374151',
          }}
        >
          <div>Name</div>
          <div>Email</div>
          <div>Specialization</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {/* Tutors */}
        {tutors.map((tutor, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns:
                '2fr 2fr 2fr 1fr 1.5fr',
              padding: '18px 24px',
              borderTop:
                '1px solid #f3f4f6',
              alignItems: 'center',
            }}
          >
            <div>{tutor.name}</div>

            <div>{tutor.email}</div>

            <div>{tutor.specialization}</div>

            <div>
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background:
                    tutor.status ===
                    'verified'
                      ? '#dcfce7'
                      : '#fef3c7',
                  color:
                    tutor.status ===
                    'verified'
                      ? '#166534'
                      : '#92400e',
                }}
              >
                {tutor.status}
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
                  background: '#dcfce7',
                  color: '#166534',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Approve
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
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}