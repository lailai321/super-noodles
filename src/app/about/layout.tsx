import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | Super Noodles – Glenmore Park, Burwood & Campbelltown',
  description: 'Super Noodles serves Chinese & Malaysian favourites across Glenmore Park, Burwood and Campbelltown. See our locations, hours and contact details.',
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
