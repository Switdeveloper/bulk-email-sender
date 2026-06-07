'use client'
import { useState, useEffect } from 'react'

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
  const [testingConnection, setTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [verifyingSender, setVerifyingSender] = useState(false)
  const [verifyResult, setVerifyResult] = useState<string | null>(null)

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

  const handleTestConnection = () => {
    setTestingConnection(true)
    setTestResult(null)
    setTimeout(() => {
      setTestResult('Connection test would run here. With a valid Brevo API key, this would verify SMTP credentials.')
      setTestingConnection(false)
    }, 1200)
  }

  const handleVerifySender = () => {
    setVerifyingSender(true)
    setVerifyResult(null)
    setTimeout(() => {
      setVerifyResult('Sender verification check would run here. With a valid API key, this would confirm your sender email is approved in Brevo.')
      setVerifyingSender(false)
    }, 1200)
  }

  return (
    <div className="container-sm">
      <div className="hero-section">
        <div className="hero-title">⚙️ Configuration Center</div>
        <div className="hero-sub">
          Set up your email provider, sender identity, and API integrations. All settings are stored securely on your server.
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-header-icon indigo">📋</div>
          Getting Started — 3 Simple Steps
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '180px', padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent)', marginBottom: '8px' }}>1</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Create a Brevo Account</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sign up free at <a href="https://www.brevo.com" target="_blank" rel="noopener">brevo.com</a> (formerly Sendinblue). No credit card required.</div>
          </div>
          <div style={{ flex: 1, minWidth: '180px', padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--cyan)', marginBottom: '8px' }}>2</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Get Your SMTP API Key</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Go to <a href="https://app.brevo.com/settings/keys/smtp" target="_blank" rel="noopener">SMTP Keys</a>, generate a key, and paste it below.</div>
          </div>
          <div style={{ flex: 1, minWidth: '180px', padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)', marginBottom: '8px' }}>3</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Verify Your Sender Email</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Add and verify your sender email in Brevo's <a href="https://app.brevo.com/senders" target="_blank" rel="noopener">Senders</a> page.</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-header-icon indigo">📡</div>
              Brevo SMTP Configuration
            </div>

            <div className="alert alert-info">
              <strong>SMTP Relay:</strong> Use <code>smtp-relay.brevo.com:587</code>. Get your SMTP key from{' '}
              <a href="https://app.brevo.com/settings/keys/smtp" target="_blank" rel="noopener">Brevo SMTP Settings</a>.
            </div>

            <div className="form-group">
              <label>BREVO SMTP API KEY</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="form-control"
                  type="password"
                  value={settings.brevoApiKey}
                  onChange={e => setSettings({ ...settings, brevoApiKey: e.target.value })}
                  placeholder="xkeys-xxxx-..."
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-outline"
                  onClick={handleTestConnection}
                  disabled={testingConnection || !settings.brevoApiKey}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {testingConnection ? <><span className="spinner" /> TESTING</> : '🔌 Test Connection'}
                </button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Found in Brevo → SMTP & SEND API → Generate a new SMTP key</div>
              {testResult && (
                <div className="alert alert-success" style={{ marginTop: '8px', marginBottom: '0' }}>{testResult}</div>
              )}
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>SMTP HOST</label>
                <input className="form-control" type="text" value={settings.brevoSmtpHost} onChange={e => setSettings({ ...settings, brevoSmtpHost: e.target.value })} />
              </div>
              <div className="form-group">
                <label>SMTP PORT</label>
                <input className="form-control" type="number" value={settings.brevoSmtpPort} onChange={e => setSettings({ ...settings, brevoSmtpPort: parseInt(e.target.value) })} />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>SMTP USER</label>
                <input className="form-control" type="text" value={settings.brevoSmtpUser} onChange={e => setSettings({ ...settings, brevoSmtpUser: e.target.value })} placeholder="Usually same as sender email" />
              </div>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label>SMTP PASSWORD</label>
                <input className="form-control" type="password" value={settings.brevoSmtpPass} onChange={e => setSettings({ ...settings, brevoSmtpPass: e.target.value })} placeholder="Leave blank to use API key" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-header-icon cyan">👤</div>
              Sender Identity
            </div>
            <div className="form-group">
              <label>SENDER NAME</label>
              <input className="form-control" type="text" value={settings.senderName} onChange={e => setSettings({ ...settings, senderName: e.target.value })} placeholder="Your name or company" />
            </div>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label>SENDER EMAIL</label>
              <input className="form-control" type="email" value={settings.senderEmail} onChange={e => setSettings({ ...settings, senderEmail: e.target.value })} placeholder="your@email.com" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-header-icon amber">📝</div>
              Default Email Template
            </div>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label>DEFAULT SUBJECT</label>
              <input className="form-control" type="text" value={settings.defaultSubject} onChange={e => setSettings({ ...settings, defaultSubject: e.target.value })} />
            </div>
            <div className="alert alert-info" style={{ marginTop: '16px', marginBottom: '0' }}>
              The compose page will auto-fill with this subject line.
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-header-icon green">🔍</div>
              Yelp Business Search
            </div>
            <div className="alert alert-info">
              <strong>Yelp Fusion API:</strong> Search businesses and import their info as contacts. Get your free key at{' '}
              <a href="https://www.yelp.com/developers" target="_blank" rel="noopener">yelp.com/developers</a> — 5,000 calls/day free.
            </div>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label>YELP API KEY</label>
              <input className="form-control" type="password" value={settings.yelpApiKey} onChange={e => setSettings({ ...settings, yelpApiKey: e.target.value })} placeholder="yelp_..." />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Found in your Yelp Developers dashboard → Create App</div>
            </div>
            <div className="alert alert-info" style={{ marginTop: '16px', marginBottom: '0' }}>
              💡 Use the <strong>YELP SEARCH</strong> tab on the Lists page to find businesses. Yelp provides name, phone, address, rating — no emails.
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-header-icon cyan">✅</div>
              Verify Sender Email
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Check that your sender email is verified in Brevo. Emails can only be sent from verified addresses.
            </div>
            <button
              className="btn btn-outline"
              onClick={handleVerifySender}
              disabled={verifyingSender || !settings.brevoApiKey || !settings.senderEmail}
            >
              {verifyingSender ? <><span className="spinner" /> CHECKING</> : '🔎 Check Verification Status'}
            </button>
            {verifyResult && (
              <div className="alert alert-success" style={{ marginTop: '12px', marginBottom: '0' }}>{verifyResult}</div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-header-icon indigo">💾</div>
              Save Configuration
            </div>
            {saved && <div className="alert alert-success">✅ Settings saved successfully!</div>}
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <><span className="spinner" /> SAVING...</> : '💾 SAVE ALL SETTINGS'}
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-header-icon amber">🔗</div>
              Quick Links
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a href="https://app.brevo.com/campaigns" target="_blank" rel="noopener" className="btn btn-outline" style={{ justifyContent: 'center' }}>
                📧 Brevo Campaign Dashboard
              </a>
              <a href="https://app.brevo.com/settings/keys/smtp" target="_blank" rel="noopener" className="btn btn-outline" style={{ justifyContent: 'center' }}>
                🔑 SMTP Keys
              </a>
              <a href="https://app.brevo.com/senders" target="_blank" rel="noopener" className="btn btn-outline" style={{ justifyContent: 'center' }}>
                ✅ Sender Verification
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
