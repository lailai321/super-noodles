'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import CartDrawer from './CartDrawer'
import MobileCartBar from './MobileCartBar'
import { useCartStore } from '@/store/cart'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const cartOpen = useCartStore(s => s.cartOpen)
  const closeCart = useCartStore(s => s.closeCart)
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  if (isAdmin) return <>{children}</>

  return (
    <>
      <Navbar />
      <div className="main-content" style={{ paddingTop: 100 }}>{children}</div>
      <CartDrawer open={cartOpen} onClose={closeCart} />
      <MobileCartBar />
    </>
  )
}
