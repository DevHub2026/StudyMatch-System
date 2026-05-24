export default function ReportsPage() {
  const reports = [
    {
      reporter: 'John Doe',
      reported: 'Michael Smith',
      reason: 'Harassment',
      status: 'Pending',
    },
    {
      reporter: 'Sarah Lee',
      reported: 'Jane Cooper',
      reason: 'Spam',
      status: 'Resolved',
    },
    {
      reporter: 'Alex Carter',
      reported: 'Daniel Reed',
      reason: 'Academic Misconduct',
      status: 'Pending',
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
        Reports Moderation
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
          <div>Reporter</div>
          <div>Reported User</div>
          <div>Reason</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {/* Reports */}
        {reports.map((report, index) => (
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
            <div>{report.reporter}</div>

            <div>{report.reported}</div>

            <div>{report.reason}</div>

            <div>
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background:
                    report.status ===
                    'Resolved'
                      ? '#dcfce7'
                      : '#fef3c7',
                  color:
                    report.status ===
                    'Resolved'
                      ? '#166534'
                      : '#92400e',
                }}
              >
                {report.status}
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
                Review
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