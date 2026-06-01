'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Settings {
  brevoApiKey: string
  brevoSmtpHost: string
  brevoSmtpPort: number
  brevoSmtpUser: string
  brevoSmtpPass: string
  senderEmail: string
  senderName: string
  defaultSubject: string
  yelpApiKey: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    brevoApiKey: '',
    brevoSmtpHost: 'smtp-relay.brevo.com',
    brevoSmtpPort: 587,
    brevoSmtpUser: '',
    brevoSmtpPass: '',
    senderEmail: 'switdeveloper@gmail.com',
    senderName: 'Swit Developer',
    defaultSubject: 'Quick question about your website',
    yelpApiKey: '',
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => { if (d.brevoApiKey || d.senderEmail) setSettings(d) })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    } catch {}
    setSaving(false)
  }

  return (
    <>
      <div className="status-bar">
        <span>🔴 LIVE SYSTEMS</span>
        <span style={{ color: 'var(--blue-accent)' }}>⚙️ CONFIGURATION</span>
      </div>

      <nav>
        <div className="logo">⚡ OPERATION<span>MAIL</span></div>
        <div className="nav-links">
          <Link href="/">📊 DASHBOARD</Link>
          <Link href="/compose">✏️ COMPOSE</Link>
          <Link href="/history">📋 HISTORY</Link>
          <Link href="/settings" className="active">⚙️ SETTINGS</Link>
        </div>
        <div className="online-indicator">
          <span className="radar-dot" />
          <span style={{ fontSize: '11px', color: 'var(--radar-green)', letterSpacing: '2px' }}>SYSTEM ONLINE</span>
        </div>
      </nav>

      <div className="container">
        <div className="grid-2">
          <div>
            <div className="panel">
              <div className="panel-title">📡 Brevo / Sendinblue SMTP</div>

              <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                <strong>Brevo Setup:</strong> Get your SMTP key from{' '}
                <a href="https://app.brevo.com/settings/keys/smtp" target="_blank" rel="noopener">Brevo SMTP Settings</a>.
                Use <code style={{ background: 'rgba(0,212,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>smtp-relay.brevo.com:587</code>.
              </div>

              <div className="form-group">
                <label>BREVO SMTP KEY</label>
                <input className="form-control" type="password" value={settings.brevoApiKey} onChange={e => setSettings({ ...settings, brevoApiKey: e.target.value })} placeholder="xkeys-xxxx-..." />
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Found in Brevo → SMTP & SEND API → Generate a new SMTP key</div>
              </div>

              <div className="form-group">
                <label>SMTP HOST</label>
                <input className="form-control" type="text" value={settings.brevoSmtpHost} onChange={e => setSettings({ ...settings, brevoSmtpHost: e.target.value })} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>SMTP PORT</label>
                  <input className="form-control" type="number" value={settings.brevoSmtpPort} onChange={e => setSettings({ ...settings, brevoSmtpPort: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>SMTP USER</label>
                  <input className="form-control" type="text" value={settings.brevoSmtpUser} onChange={e => setSettings({ ...settings, brevoSmtpUser: e.target.value })} placeholder=" Usually same as sender email" />
                </div>
              </div>

              <div className="form-group">
                <label>SMTP PASSWORD</label>
                <input className="form-control" type="password" value={settings.brevoSmtpPass} onChange={e => setSettings({ ...settings, brevoSmtpPass: e.target.value })} placeholder="Leave blank to use Brevo API key" />
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">👤 Sender Identity</div>
              <div className="form-group">
                <label>SENDER NAME</label>
                <input className="form-control" type="text" value={settings.senderName} onChange={e => setSettings({ ...settings, senderName: e.target.value })} placeholder="Your name or company" />
              </div>
              <div className="form-group">
                <label>SENDER EMAIL</label>
                <input className="form-control" type="email" value={settings.senderEmail} onChange={e => setSettings({ ...settings, senderEmail: e.target.value })} placeholder="your@email.com" />
              </div>
            </div>
          </div>

          <div>
            <div className="panel">
              <div className="panel-title">📝 Default Email Template</div>
              <div className="form-group">
                <label>DEFAULT SUBJECT</label>
                <input className="form-control" type="text" value={settings.defaultSubject} onChange={e => setSettings({ ...settings, defaultSubject: e.target.value })} />
              </div>
              <div className="alert alert-info">
                The compose page will auto-fill with this subject line.
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">🔍 Yelp Business Search</div>
              <div className="alert alert-info" style={{ marginBottom: '16px' }}>
                <strong>Yelp Fusion API:</strong> Search businesses and import their info as contacts. Get your free key at{' '}
                <a href="https://www.yelp.com/developers" target="_blank" rel="noopener" style={{ color: 'var(--blue-accent)' }}>yelp.com/developers</a> — 5,000 calls/day free.
              </div>
              <div className="form-group">
                <label>YELP API KEY</label>
                <input className="form-control" type="password" value={settings.yelpApiKey} onChange={e => setSettings({ ...settings, yelpApiKey: e.target.value })} placeholder="yelp_..." />
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Found in your Yelp Developers dashboard → Create App</div>
              </div>
              <div className="alert alert-info">
                💡 Use the <strong>YELP SEARCH</strong> tab on the Lists page to find businesses. Yelp provides name, phone, address, rating — no emails.
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">💾 Save Configuration</div>
              {saved && <div className="alert alert-success">✅ Settings saved successfully!</div>}
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '14px', padding: '14px' }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <><span className="spinner" /> SAVING...</> : '💾 SAVE ALL SETTINGS'}
              </button>
            </div>

            <div className="panel">
              <div className="panel-title">🔗 Quick Links</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a href="https://app.brevo.com/campaigns" target="_blank" rel="noopener" className="btn btn-outline" style={{ justifyContent: 'center' }}>
                  📧 Brevo Campaign Dashboard
                </a>
                <a href="https://app.brevo.com/settings/keys/smtp" target="_blank" rel="noopener" className="btn btn-outline" style={{ justifyContent: 'center' }}>
                  🔑 SMTP Keys
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}