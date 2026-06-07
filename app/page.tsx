'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Stats { total: number; sent: number; failed: number; last24h: number; last7d: number }

export default function Home() {
  const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, failed: 0, last24h: 0, last7d: 0 })

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(d => setStats(d.stats || { total: 0, sent: 0, failed: 0, last24h: 0, last7d: 0 }))
      .catch(() => {})
  }, [])

  const successRate = stats.sent && stats.total ? Math.round((stats.sent / stats.total) * 100) : 0

  return (
    <div className="container">
      <div className="hero-section">
        <h1 className="hero-title">Dashboard</h1>
        <p className="hero-sub">Monitor your email campaign performance and system status.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-value blue">{stats.total}</div>
          <div className="stat-card-label">Total Sent</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value green">{stats.sent}</div>
          <div className="stat-card-label">Delivered</div>
        </div>
        <div className="stat-card">
          <div className={`stat-card-value ${stats.failed > 0 ? 'red' : 'blue'}`}>{stats.failed}</div>
          <div className="stat-card-label">Failed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value amber">{successRate}%</div>
          <div className="stat-card-label">Success Rate</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-header-icon indigo">📡</div>
            Activity Overview
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
              <div style={{ fontSize: '28px', fontFamily: 'Plus Jakarta Sans', fontWeight: 800, color: 'var(--success)' }}>{stats.last24h}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginTop: '4px' }}>LAST 24 HOURS</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-surface)', borderRadius: '8px' }}>
              <div style={{ fontSize: '28px', fontFamily: 'Plus Jakarta Sans', fontWeight: 800, color: 'var(--accent)' }}>{stats.last7d}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginTop: '4px' }}>LAST 7 DAYS</div>
            </div>
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link href="/compose" className="btn btn-primary" style={{ justifyContent: 'center' }}>✏️ NEW CAMPAIGN</Link>
            <Link href="/history" className="btn btn-outline" style={{ justifyContent: 'center' }}>📋 VIEW HISTORY</Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-header-icon green">⚡</div>
            Quick Status
          </div>
          <div style={{ fontSize: '13px', lineHeight: '2.2', color: 'var(--text-secondary)' }}>
            <div>📧 Total emails sent: <strong style={{ color: 'var(--accent)' }}>{stats.total}</strong></div>
            <div>✅ Delivered: <strong style={{ color: 'var(--success)' }}>{stats.sent}</strong></div>
            <div>❌ Failed: <strong style={{ color: stats.failed > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>{stats.failed}</strong></div>
            <div>📊 Success rate: <strong style={{ color: successRate >= 90 ? 'var(--success)' : 'var(--amber)' }}>{successRate}%</strong></div>
          </div>
          <div className="divider" />
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
            <div style={{ color: 'var(--accent)', fontWeight: 'bold', marginBottom: '8px' }}>BREVO SMTP</div>
            <div>Configure your Brevo API key in Settings to start sending emails.</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <div className="card-header-icon cyan">📋</div>
          Recent Activity
        </div>
        {stats.total === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No emails sent yet. Go to Compose to send your first campaign!</p>
        ) : (
          <p style={{ color: 'var(--success)', fontSize: '13px' }}>✅ System operational. {stats.sent} emails delivered successfully.</p>
        )}
      </div>
    </div>
  )
}
