'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Recipient { email: string; name: string }
interface SendResult { email: string; name: string; success: boolean; error?: string }
interface SendResponse { sent: number; failed: number; results: SendResult[] }

export default function Compose() {
  const [recipientInput, setRecipientInput] = useState('')
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [subject, setSubject] = useState('Quick question about your website')
  const [body, setBody] = useState(`Hi,

I'm reaching out because I noticed your website and had a quick question about your business.

Would love to connect and learn more about what you do.

Best regards`)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<SendResponse | null>(null)
  const [error, setError] = useState('')
  const [parseMode, setParseMode] = useState<'bulk' | 'single'>('bulk')

  const handleAddRecipients = () => {
    const lines = recipientInput.split('\n').filter(Boolean)
    const newRecipients: Recipient[] = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      // Format: "Name <email>" or just "email"
      const match = trimmed.match(/^(.+?)\s*<(.+?)>$/)
      if (match) {
        newRecipients.push({ name: match[1].trim(), email: match[2].trim().toLowerCase() })
      } else if (trimmed.includes('@')) {
        newRecipients.push({ name: trimmed.split('@')[0], email: trimmed.toLowerCase() })
      }
    }
    setRecipients(prev => {
      const existing = new Set(prev.map(r => r.email))
      const unique = newRecipients.filter(r => !existing.has(r.email))
      return [...prev, ...unique]
    })
    setRecipientInput('')
  }

  const removeRecipient = (email: string) => {
    setRecipients(prev => prev.filter(r => r.email !== email))
  }

  const handleSend = async () => {
    if (recipients.length === 0) { setError('Add at least one recipient'); return }
    if (!subject.trim()) { setError('Subject is required'); return }
    if (!body.trim()) { setError('Body is required'); return }

    setSending(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients, subject, body }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Send failed'); setSending(false); return }
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="status-bar">
        <span>🔴 LIVE SYSTEMS</span>
        <span style={{ color: 'var(--radar-green)' }}>⚡ READY TO TRANSMIT</span>
      </div>

      <nav>
        <div className="logo">⚡ OPERATION<span>MAIL</span></div>
        <div className="nav-links">
          <Link href="/">📊 DASHBOARD</Link>
          <Link href="/compose" className="active">✏️ COMPOSE</Link>
          <Link href="/history">📋 HISTORY</Link>
          <Link href="/settings">⚙️ SETTINGS</Link>
        </div>
        <div className="online-indicator">
          <span className="radar-dot" />
          <span style={{ fontSize: '11px', color: 'var(--radar-green)', letterSpacing: '2px' }}>SYSTEM ONLINE</span>
        </div>
      </nav>

      <div className="container">
        <div className="grid-2">
          {/* LEFT — Compose Form */}
          <div>
            <div className="panel">
              <div className="panel-title">✏️ COMPOSE MESSAGE</div>

              {error && <div className="alert alert-error">{error}</div>}

              <div className="form-group">
                <label>RECIPIENTS ({recipients.length} added)</label>
                <div style={{ marginBottom: '8px' }}>
                  <select className="form-control" style={{ width: 'auto', fontSize: '12px' }} onChange={e => setParseMode(e.target.value as 'bulk' | 'single')} value={parseMode}>
                    <option value="bulk">Bulk (one per line)</option>
                    <option value="single">Single email</option>
                  </select>
                </div>
                <textarea
                  className="form-control"
                  rows={parseMode === 'bulk' ? 6 : 1}
                  placeholder={parseMode === 'bulk' ? 'Name <email@example.com>\nName2 <email2@example.com>\n...' : 'recipient@example.com'}
                  value={recipientInput}
                  onChange={e => setRecipientInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && parseMode === 'single') { e.preventDefault(); handleAddRecipients() }
                  }}
                />
                <button className="btn btn-outline" style={{ marginTop: '8px', width: '100%' }} onClick={handleAddRecipients}>
                  + ADD RECIPIENT{recipientInput.includes('\n') ? 'S' : ''}
                </button>
              </div>

              {recipients.length > 0 && (
                <div className="recipient-tags">
                  {recipients.map(r => (
                    <div key={r.email} className="recipient-tag">
                      {r.name ? `${r.name} ` : ''}{r.email}
                      <button onClick={() => removeRecipient(r.email)}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="section-divider" />

              <div className="form-group">
                <label>SUBJECT</label>
                <input className="form-control" type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..." />
              </div>

              <div className="form-group">
                <label>MESSAGE BODY</label>
                <textarea className="form-control" rows={10} value={body} onChange={e => setBody(e.target.value)} />
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '14px', padding: '14px' }}
                onClick={handleSend}
                disabled={sending || recipients.length === 0}
              >
                {sending ? <><span className="spinner" /> TRANSMITTING...</> : `⚡ SEND TO ${recipients.length} RECIPIENT${recipients.length !== 1 ? 'S' : ''}`}
              </button>
            </div>
          </div>

          {/* RIGHT — Preview + Status */}
          <div>
            <div className="panel">
              <div className="panel-title">📧 LIVE PREVIEW</div>
              <div className="email-preview">
                <div className="preview-header">
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>TO:</div>
                  <div style={{ color: 'var(--blue-accent)', fontSize: '13px', marginBottom: '8px' }}>
                    {recipients.length > 0 ? recipients.map(r => r.email).join(', ') : '<No recipients>'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>SUBJECT:</div>
                  <div className="preview-subject">{subject || '<No subject>'}</div>
                </div>
                <div className="preview-body">
                  {body.split('\n').filter(Boolean).map((line, i) => <p key={i}>{line}</p>)}
                </div>
              </div>
            </div>

            {result && (
              <div className="panel">
                <div className="panel-title">📡 TRANSMISSION REPORT</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'var(--navy-mid)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontFamily: 'Orbitron', color: 'var(--radar-green)' }}>{result.sent}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '2px', marginTop: '4px' }}>SENT</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '16px', background: 'var(--navy-mid)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontFamily: 'Orbitron', color: result.failed > 0 ? 'var(--red-alert)' : 'var(--text-secondary)' }}>{result.failed}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', letterSpacing: '2px', marginTop: '4px' }}>FAILED</div>
                  </div>
                </div>
                <div className="send-status">
                  {result.results.map((r, i) => (
                    <div key={i} className="send-status-item">
                      <span className="status-icon">{r.success ? '✅' : '❌'}</span>
                      <span className="email">{r.name ? `${r.name} ` : ''}{r.email}</span>
                      <span className="badge">{r.success ? 'sent' : 'failed'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}