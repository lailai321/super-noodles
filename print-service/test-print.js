'use strict'
// Manual test print — sends a fake receipt straight to the printer.
// Does NOT touch the live API or any real order. Run with: node test-print.js
const { buildReceipt, sendToPrinter } = require('./print-service.js')

const mockOrder = {
  order_number: 9999,
  created_at: new Date().toISOString(),
  pickup_time: 'asap',
  customer_name: 'Test Print',
  customer_phone: '0412345678',
  total_cents: 6500,
  order_items: [
    {
      item_name: 'Combo 1 - Beef Noodles',
      quantity: 2,
      unit_price_cents: 1500,
      extra_meat: true,
      extra_vegetable: false,
      notes: 'Flavours: Mild, Garlic | NOTE: no coriander',
    },
    {
      item_name: 'Spring Rolls',
      quantity: 1,
      unit_price_cents: 500,
      extra_meat: false,
      extra_vegetable: false,
      notes: '',
    },
  ],
}

console.log('Sending test receipt to printer...')
sendToPrinter(buildReceipt(mockOrder))
  .then(() => console.log('Done — check the printer.'))
  .catch(err => console.error('FAILED:', err.message))
