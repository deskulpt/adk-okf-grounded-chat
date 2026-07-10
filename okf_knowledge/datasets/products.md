---
type: "BigQuery Table"
title: "Product Catalog"
tags: ["products", "catalog", "sku", "inventory", "pricing"]
description: "Master product catalog with SKU, category, and unit price"
resource: "bigquery://omnidepo-copilot/datasets/catalog/products"
timestamp: "2026-07-10T12:00:00Z"
---
# Product Catalog

Master list of sellable SKUs referenced by the sales transactions table.

| sku | name | category | unit_price | cost |
|-----|------|----------|-----------:|-----:|
| SW-101 | Microswitch 5A | switches | 1.20 | 0.55 |
| SW-204 | Limit Switch IP67 | switches | 4.80 | 2.10 |
| MT-330 | Drill Chuck 13mm | machine-tools | 12.40 | 6.00 |
| MT-512 | Indexing Fixture | machine-tools | 38.00 | 19.50 |
| AU-007 | PLC Module 8ch | automation | 22.50 | 11.00 |
| AU-019 | Proximity Sensor | automation | 6.30 | 2.80 |

`unit_price` and `cost` are in USD. Join key to sales: `items[].sku`.
