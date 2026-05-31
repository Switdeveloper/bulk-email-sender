'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Stats { total: number; sent: number; failed: number; last24h: number; last7d: number }

export default function Home() {
  const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, failed: 0, last24h: 0, last7d: 0 })
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => setTime(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC')
    update()
    const i = setInterval(update, 1000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(d => setStats(d.stats || { total: 0, sent: 0, failed: 0, last24h: 0, last7d: 0 }))
      .catch(() => {})
  }, [])

  const successRate = stats.sent && stats.total ? Math.round((stats.sent / stats.total) * 100) : 0

  return (
    <>
      <div className="status-bar">
        <span>🔴 LIVE SYSTEMS</span>
        <span>{time}</span>
      </div>

      <nav>
        <div className="logo">⚡ OPERATION<span>MAIL</span></div>
        <div className="nav-links">
          <Link href="/" className="active">📊 DASHBOARD</Link>
          <Link href="/compose">✏️ COMPOSE</Link>
          <Link href="/history">📋 HISTORY</Link>
          <Link href="/settings">⚙️ SETTINGS</Link>
        </div>
        <div className="online-indicator">
          <span className="radar-dot" />
          <span style={{ fontSize: '11px', color: 'var(--radar-green)', letterSpacing: '2px' }}>SYSTEM ONLINE</span>
        </div>
      </nav>

      <div className="container">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="value">{stats.total}</div>
            <div className="label">Total Sent</div>
          </div>
          <div className="stat-card radar-sweep">
            <div className="value">{stats.sent}</div>
            <div className="label">Delivered</div>
          </div>
          <div className="stat-card">
            <div className="value" style={{ color: stats.failed > 0 ? 'var(--red-alert)' : 'var(--blue-accent)' }}>{stats.failed}</div>
            <div className="label">Failed</div>
          </div>
          <div className="stat-card">
            <div className="value">{successRate}%</div>
            <div className="label">Success Rate</div>
          </div>
        </div>

        <div className="grid-2">
          <div className="panel">
            <div className="panel-title">📡 Activity Overview</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '16px', background: 'var(--navy-mid)', borderRadius: '8px' }}>
                <div style={{ fontSize: '28px', fontFamily: 'Orbitron', color: 'var(--radar-green)' }}>{stats.last24h}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '2px', marginTop: '4px' }}>LAST 24 HOURS</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: 'var(--navy-mid)', borderRadius: '8px' }}>
                <div style={{ fontSize: '28px', fontFamily: 'Orbitron', color: 'var(--blue-accent)' }}>{stats.last7d}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '2px', marginTop: '4px' }}>LAST 7 DAYS</div>
              </div>
            </div>
            <div className="section-divider" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/compose" className="btn btn-primary" style={{ justifyContent: 'center' }}>✏️ NEW CAMPAIGN</Link>
              <Link href="/history" className="btn btn-outline" style={{ justifyContent: 'center' }}>📋 VIEW HISTORY</Link>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">⚡ Quick Status</div>
            <div style={{ fontSize: '13px', lineHeight: '2.2', color: 'var(--text-secondary)' }}>
              <div>📧 Total emails sent: <strong style={{ color: 'var(--blue-accent)' }}>{stats.total}</strong></div>
              <div>✅ Delivered: <strong style={{ color: 'var(--radar-green)' }}>{stats.sent}</strong></div>
              <div>❌ Failed: <strong style={{ color: stats.failed > 0 ? 'var(--red-alert)' : 'var(--text-secondary)' }}>{stats.failed}</strong></div>
              <div>📊 Success rate: <strong style={{ color: successRate >= 90 ? 'var(--radar-green)' : 'var(--amber)' }}>{successRate}%</strong></div>
            </div>
            <div className="section-divider" />
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              <div style={{ color: 'var(--blue-accent)', fontWeight: 'bold', marginBottom: '8px' }}>BREVO SMTP</div>
              <div>Configure your Brevo API key in Settings to start sending emails.</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">📋 Recent Activity</div>
          {stats.total === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No emails sent yet. Go to Compose to send your first campaign!</p>
          ) : (
            <p style={{ color: 'var(--radar-green)', fontSize: '13px' }}>✅ System operational. {stats.sent} emails delivered successfully.</p>
          )}
        </div>
      </div>
    </>
  )
}