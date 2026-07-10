---
type: "Report"
title: "Q2 Revenue & Margin Report"
tags: ["report", "sales", "revenue", "margin", "products", "join", "q2"]
description: "Cross-table sales vs catalog analysis with the join logic to reproduce it"
resource: "report://omnidepo/q2-revenue-margin"
timestamp: "2026-07-10T13:00:00Z"
---
# Q2 Revenue & Margin Report

Reconciles `sales.md` (transactions) against `products.md` (catalog) on
`items[].sku = products.sku`. This is the join the agent must perform to
answer revenue, units, and margin questions.

## Join logic (BigQuery SQL)
```sql
SELECT
  p.sku, p.name, p.category,
  SUM(s.revenue)            AS revenue,
  SUM(s.qty)                AS units,
  SUM(s.revenue) - SUM(s.qty * p.cost) AS gross_margin
FROM   analytics_ga4.sales  AS s,
       UNNEST(s.items)       AS li
JOIN   catalog.products      AS p
  ON   li.sku = p.sku
WHERE  s.timestamp BETWEEN '2026-04-01' AND '2026-06-30'
GROUP  BY p.sku, p.name, p.category
ORDER  BY revenue DESC;
```

## Headline numbers (Q2)
- Total revenue: **$48,210** across **3,910** units.
- Top category by revenue: **machine-tools** ($21,440).
- Best SKU: **MT-512 Indexing Fixture** — $15,200 revenue, $7,800 margin.
- Blended gross margin: **52.4%**.

## How to read this for queries
- "Top selling product" → order by `units` (not revenue).
- "Most profitable" → order by `gross_margin`.
- "Revenue by category" → `GROUP BY category`.
- Unknown SKU in a transaction → it is not in `products.md`; report as
  unmatched, do not invent a price.
