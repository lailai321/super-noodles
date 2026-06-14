import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    id: '/admin',
    name: 'Super Noodles Admin',
    short_name: 'SN Admin',
    description: 'Super Noodles order and menu management.',
    start_url: '/admin',
    scope: '/admin/',
    display: 'standalone',
    background_color: '#F3BD25',
    theme_color: '#F3BD25',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/admin-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  })
}
