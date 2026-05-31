import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '⚡ OPERATION MAIL — Bulk Email Sender',
  description: 'Naval Command Center — Bulk Email System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}