import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Current Offers | Super Noodles Glenmore Park',
  description: 'See current deals and promo codes for online Chinese & Malaysian takeaway orders at Super Noodles, Glenmore Park.',
}

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return children
}
