# Order Operations Design

## Scope

Add a tablet-friendly order workspace to `/admin`, customer order status tracking,
and ClickSend SMS notifications when an order is ready.

## Order flow

`confirmed -> ready -> collected`

There is no online cancellation flow.

## Admin

- Password login uses a signed, HttpOnly, Secure, SameSite cookie valid for 180 days.
- All admin APIs require the cookie.
- Orders is the default tab; Menu keeps price and sold-out controls only.
- Today's active orders refresh every 5 seconds, newest first.
- New paid orders remain audible until acknowledged. Acknowledgement is stored in the database.
- Mark Ready changes status and sends one SMS.
- Failed SMS attempts show Retry SMS without changing the Ready status.
- Mark Collected moves the order into a collapsed Collected Today section.
- Customer name and full phone number are visible as plain text.

## Customer tracking

- Search by phone number.
- Normalize Australian phone formatting before matching.
- Show the last 90 days, newest first.
- Refresh every 15 seconds while the page is visible.
- Status labels:
  - confirmed: We're preparing your order
  - ready: Ready for pickup
  - collected: Order collected
- Do not expose customer name, full phone number, acknowledgement, or SMS metadata.

## Notifications

- Browser alert is an original three-note Web Audio sound, repeated every 20 seconds until acknowledged.
- Telegram remains as a backup new-order notification.
- ClickSend message:
  `Super Noodles: Order #0123 is ready for pickup at Glenmore Park. Please collect it at the counter.`

## Reliability

- Ready transition is conditional on the current status.
- SMS sending has a database claim state to prevent accidental duplicate sends.
- SMS result, timestamp, provider message ID, and error are recorded.
- Missing ClickSend credentials are reported as a visible admin error.
