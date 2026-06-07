'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface EmailRecord {
  id: string
  to: string
  toName: string
  subject: string
  body: string
  status: 'sent' | 'failed'
  error?: string
  sentAt: string
  senderEmail: string
  senderName: string
}

interface HistoryResponse { history: EmailRecord[]; stats: any }

export default function History() {
  const [history, setHistory] = useState<EmailRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed'>('all')

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then((d: HistoryResponse) => { setHistory(d.history || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? history : history.filter(h => h.status === filter)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <div className="card-header-icon indigo">📋</div>
          <span>SENT EMAILS ({filtered.length})</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            {(['all', 'sent', 'failed'] as const).map(f => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}><span className="spinner" style={{ width: '32px', height: '32px' }} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <div>No transmission records found.</div>
            <Link href="/compose" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>SEND FIRST CAMPAIGN</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>STATUS</th>
                  <th>RECIPIENT</th>
                  <th>SUBJECT</th>
                  <th>SENT BY</th>
                  <th>DATE</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(record => (
                  <tr key={record.id}>
                    <td>
                      <span className={`badge badge-${record.status === 'sent' ? 'success' : 'danger'}`}>
                        {record.status === 'sent' ? '✅ SENT' : '❌ FAILED'}
                      </span>
                      {record.error && <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }}>{record.error}</div>}
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-primary)' }}>{record.toName || record.to.split('@')[0]}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{record.to}</div>
                    </td>
                    <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.subject}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{record.senderName}<br />{record.senderEmail}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDate(record.sentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
