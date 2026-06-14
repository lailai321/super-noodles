export default function OffersPage() {
  return (
    <div className="min-h-screen bg-[#f9f5f0]">
      <div className="max-w-md mx-auto px-4 py-10">
        <a href="/" className="text-sm text-gray-500 hover:text-gray-700 mb-6 block">← Back to Menu</a>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Current Offers</h1>
        <p className="text-sm text-gray-500 mb-8">Special deals available for online orders.</p>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-red-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🎉</span>
              <div>
                <h2 className="font-bold text-gray-900">$5 OFF Your Order</h2>
                <p className="text-xs text-gray-500">Min. spend $50 • Online orders only</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Save $5 on any online order over $50. Enter the code at checkout.
            </p>
            <div className="bg-red-50 rounded-lg px-4 py-2 inline-block">
              <span className="font-mono font-bold text-red-600 tracking-widest">HIGH5</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 opacity-60">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">📢</span>
              <div>
                <h2 className="font-bold text-gray-900">Stay Tuned</h2>
                <p className="text-xs text-gray-500">More deals coming soon</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Follow us on social media for the latest offers and promotions.</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block bg-red-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-red-700 transition-colors"
          >
            Order Now
          </a>
        </div>
      </div>
    </div>
  )
}
