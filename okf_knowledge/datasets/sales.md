---
type: "BigQuery Table"
title: "E-commerce Sales Data"
tags: ["sales", "revenue", "transactions", "ga4"]
description: "Core sales transactions catalogued from Google Analytics 4"
resource: "bigquery://omnidepo-copilot/datasets/analytics_ga4/sales"
timestamp: "2026-07-10T12:00:00Z"
---
# E-commerce Sales Dataset

This concept holds documentation for the raw e-commerce transaction data.
It maps the GA4 billing and transaction attributes:
- `transaction_id`: unique transaction string
- `revenue`: gross revenue amount in USD
- `items`: array of products in the cart
- `buyer_id`: cross-reference to user profiles
