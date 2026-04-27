export default function Loading() {
  return (
    <div style={{ padding: 24, animation: 'pulse 1.5s infinite ease-in-out' }}>
      <div style={{ width: 200, height: 32, background: 'var(--border)', borderRadius: 8, marginBottom: 12 }} />
      <div style={{ width: 150, height: 20, background: 'var(--border)', borderRadius: 8, marginBottom: 32 }} />
      
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card" style={{ height: 120, background: 'var(--bg)', borderColor: 'var(--border)' }}>
            <div style={{ width: 40, height: 40, background: 'var(--border)', borderRadius: '50%', marginBottom: 16 }} />
            <div style={{ width: 80, height: 24, background: 'var(--border)', borderRadius: 4 }} />
          </div>
        ))}
      </div>

      <div className="card" style={{ height: 400, background: 'var(--bg)', borderColor: 'var(--border)' }}>
        <div className="card-header" style={{ borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 150, height: 24, background: 'var(--border)', borderRadius: 4 }} />
        </div>
        <div className="card-body" style={{ padding: 24 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ width: '30%', height: 20, background: 'var(--border)', borderRadius: 4 }} />
              <div style={{ width: '20%', height: 20, background: 'var(--border)', borderRadius: 4 }} />
              <div style={{ width: '15%', height: 20, background: 'var(--border)', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
