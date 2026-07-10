---
type: "API Reference"
title: "Returns & Refunds API"
tags: ["api", "returns", "refund", "orders", "webhook"]
description: "Endpoint and webhook contract for creating and tracking order returns"
resource: "api://omnidepo/returns/v2"
timestamp: "2026-07-10T11:15:00Z"
---
# Returns API v2

Create a return for a fulfilled order.

## POST /v2/returns
Body:
- `order_id`: string (required)
- `items`: array of `{ sku, qty, reason }`
- `refund_method`: `original` | `store_credit`

Response `201`:
```
{ "return_id": "r_8f2", "status": "pending", "eta_refund_days": 5 }
```

## Webhook `return.status_changed`
Fires on `pending → approved → picked → refunded`.
Payload includes `return_id` and `status`.

## Rules
- Refund to original method within 5 business days.
- Store credit is instant on approval.
