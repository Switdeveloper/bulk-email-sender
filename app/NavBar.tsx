'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/compose', label: 'Compose', icon: '✉️' },
  { href: '/templates', label: 'Templates', icon: '📝' },
  { href: '/lists', label: 'Lists', icon: '📋' },
  { href: '/history', label: 'History', icon: '📄' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function NavBar() {
  const path = usePathname()

  return (
    <>
      <div style={{
        background: 'rgba(11, 17, 32, 0.9)',
        borderBottom: '1px solid var(--border)',
        padding: '6px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--text-muted)',
      }}>
        <span>📧 Bulk Email Sender</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="status-dot" />
          System Online
        </span>
      </div>

      <nav className="navbar">
        <Link href="/" className="navbar-logo">
          <span className="navbar-logo-icon">📬</span>
          MailBlast
        </Link>
        <div className="navbar-links">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={path === l.href ? 'active' : ''}
            >
              {l.icon} {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
