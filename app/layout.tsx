import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Bulk Email Sender - Naval Command Center',
  description: 'Real-time email campaign system with Brevo integration',
  themeColor: '#00d4ff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className} style={{ backgroundColor: '#0a1628', color: '#e0e0e0', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
