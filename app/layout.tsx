import type { Metadata } from 'next'
import './globals.css'
import NavBar from './NavBar'

export const metadata: Metadata = {
  title: 'MailBlast — Bulk Email Sender',
  description: 'Send bulk emails with ease using Brevo integration, contact lists, and templates.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  )
}
