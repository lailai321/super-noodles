import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Catering Enquiry | Super Noodles Glenmore Park, Penrith',
  description: 'Planning an event in Glenmore Park or Penrith? Enquire about Chinese & Malaysian catering from Super Noodles — laksa, fried rice, honey chicken and more for groups.',
}

export default function CateringLayout({ children }: { children: React.ReactNode }) {
  return children
}
