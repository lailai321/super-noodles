import { GIFT_OFFERS } from '@/lib/giftRules'

export default function PromoBanner() {
  return (
    <div className="promo-scroll hide-scrollbar">
      {GIFT_OFFERS.map((offer, i) => (
        <div key={i} className="coupon-card">
          <span className="coupon-title">{offer.title}</span>
          <span className="coupon-subtitle">{offer.subtitle}</span>
        </div>
      ))}
    </div>
  )
}
