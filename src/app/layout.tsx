import type { Metadata } from 'next'
import './globals.css'
import ClientLayout from '@/components/ClientLayout'

export const metadata: Metadata = {
  title: 'Super Noodles | Glenmore Park',
  description: 'Order authentic Cantonese & Malaysian food for pickup at Super Noodles, Glenmore Park Town Centre.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
