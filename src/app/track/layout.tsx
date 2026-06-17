import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Track Your Order | Super Noodles Glenmore Park',
  description: 'Check the status of your Super Noodles pickup order in Glenmore Park by entering your phone number.',
}

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children
}
