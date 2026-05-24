export default function ResourcesPage() {
  const resources = [
    {
      title: 'Calculus Notes',
      uploader: 'John Doe',
      category: 'Mathematics',
      status: 'Approved',
    },
    {
      title: 'Physics Reviewer',
      uploader: 'Sarah Miller',
      category: 'Physics',
      status: 'Pending',
    },
    {
      title: 'JavaScript Guide',
      uploader: 'Daniel Carter',
      category: 'Programming',
      status: 'Flagged',
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
        Resources Management
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
          <div>Title</div>
          <div>Uploader</div>
          <div>Category</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {/* Resources */}
        {resources.map((resource, index) => (
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
            <div>{resource.title}</div>

            <div>{resource.uploader}</div>

            <div>{resource.category}</div>

            <div>
              <span
                style={{
                  padding: '6px 12px',
                  borderRadius: '999px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background:
                    resource.status ===
                    'Approved'
                      ? '#dcfce7'
                      : resource.status ===
                        'Pending'
                      ? '#fef3c7'
                      : '#fee2e2',
                  color:
                    resource.status ===
                    'Approved'
                      ? '#166534'
                      : resource.status ===
                        'Pending'
                      ? '#92400e'
                      : '#991b1b',
                }}
              >
                {resource.status}
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
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}