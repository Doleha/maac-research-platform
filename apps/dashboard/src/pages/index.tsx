import { useState, useEffect } from 'react';

interface HealthStatus {
  status: string;
  service: string;
}

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    fetch(`${apiUrl}/health`)
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          MAAC Research Platform Dashboard
        </h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          Multi-Agent Adaptive Cognition Research Platform
        </p>
      </header>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>System Status</h2>
        <div
          style={{
            padding: '1.5rem',
            borderRadius: '8px',
            backgroundColor: health?.status === 'ok' ? '#d4edda' : '#f8d7da',
            border: `1px solid ${health?.status === 'ok' ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {loading ? (
            <p>Checking API status...</p>
          ) : health ? (
            <>
              <p style={{ margin: 0, fontWeight: 'bold' }}>
                ✅ {health.service} - Status: {health.status.toUpperCase()}
              </p>
            </>
          ) : (
            <p style={{ margin: 0 }}>❌ API is unavailable</p>
          )}
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Features</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {[
            { title: 'Experiment Monitoring', desc: 'Track research experiments in real-time' },
            { title: 'Statistical Analysis', desc: 'Visualize and analyze experimental data' },
            { title: 'Cognitive Evaluation', desc: 'Evaluate LLM cognitive performance' },
            { title: 'Open Source', desc: 'MIT licensed, community-driven development' },
          ].map((feature, idx) => (
            <div
              key={idx}
              style={{
                padding: '1.5rem',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: '1.2rem' }}>{feature.title}</h3>
              <p style={{ color: '#666', marginBottom: 0 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #dee2e6', color: '#666' }}>
        <p>Part of doctoral research on multi-agent cognitive systems.</p>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Open Source | MIT License
        </p>
      </footer>
    </main>
  );
}
