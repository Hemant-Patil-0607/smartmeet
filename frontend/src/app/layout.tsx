import '@/styles/globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'SmartMeet - Meeting Intelligence Platform',
  description: 'Turn meetings into actionable intelligence',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-gray-50 text-neutral-dark font-sans antialiased">{children}</body>
    </html>
  )
}
