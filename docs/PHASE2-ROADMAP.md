# TrackAS Phase 2 Roadmap

## Overview

Phase 2 builds on the Phase 1 MVP: tracking, assignments, payments, and basic dashboards. The focus is monetization, reliability, and integration.

---

## Prioritization Matrix

| Priority | High ROI, Low Complexity | High ROI, High Complexity |
|----------|--------------------------|----------------------------|
| **Do first** | Observability, Webhooks | Fleet subscriptions & pricing |
| **Do next** | ETA estimation | Notifications (WhatsApp/SMS/Email) |

---

## 1. Observability (Logs, Metrics)

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 – Do first |
| **ROI** | High (reduces downtime, speeds debugging) |
| **Complexity** | Low |
| **Dependencies** | None |

**Problem solved**
- Hard to detect failures and performance issues in production.
- No visibility into latency, errors, or usage patterns.

**Impact**
- Faster incident response.
- Data to improve performance and reliability.
- Foundation for SLAs.

**Deliverables**
- Structured logging (JSON, correlation IDs).
- Metrics (Prometheus or provider-native: request rate, latency, errors).
- Health checks (DB, external services).
- Optional: APM/tracing for critical paths.

---

## 2. Webhooks for Shippers

| Attribute | Value |
|-----------|-------|
| **Priority** | P1 – Do first |
| **ROI** | High (improves shipper integrations) |
| **Complexity** | Low–Medium |
| **Dependencies** | None |

**Problem solved**
- Shippers must poll for status changes.
- No push-based integration for ERP/WMS.

**Impact**
- Shippers can react to events in real time.
- Enables integrations without polling.
- Competitive differentiator.

**Deliverables**
- Webhook registration: URL + events (e.g. `shipment.delivered`, `shipment.status_changed`).
- Event dispatch with retries and backoff.
- Webhook logs/status for debugging.
- HMAC signature for verification.

---

## 3. Fleet Subscriptions & Pricing

| Attribute | Value |
|-----------|-------|
| **Priority** | P2 – Do next |
| **ROI** | High (core monetization) |
| **Complexity** | High |
| **Dependencies** | Payment gateway (Phase 1 has escrow only) |

**Problem solved**
- No clear pricing model for fleet owners.
- Manual billing; no automated invoicing or subscriptions.

**Impact**
- Predictable revenue from fleet subscriptions.
- Productized plans (e.g. per-vehicle, per-shipment tiers).
- Scales with usage.

**Deliverables**
- Subscription plans (e.g. Basic, Pro, Enterprise).
- Per-vehicle or per-shipment pricing.
- Stripe/Paddle or similar integration.
- Invoice generation and payment flows.
- Usage metering and limits.

---

## 4. ETA Estimation

| Attribute | Value |
|-----------|-------|
| **Priority** | P2 – Do next |
| **ROI** | Medium–High (better CX) |
| **Complexity** | Medium |
| **Dependencies** | Tracking events (Phase 1) |
| **Status** | v1 implemented |

**Problem solved**
- Public tracking shows `eta: null`.
- Shippers and customers have no delivery time estimate.

**Impact**
- Higher customer satisfaction.
- Fewer “where is my delivery?” inquiries.
- Enables scheduling (e.g. recipient availability).

**Deliverables (v1)**
- ETA logic: Haversine distance + configurable average speed (`ETA_AVERAGE_SPEED_KMH`).
- Compute ETA on read (no persistence).
- Expose ETA in `GET /public/track/:shipmentId` and `GET /shipments` (shipper).
- Rules: null if no pickup, no delivery destination, or already delivered.

---

## 5. Notifications (WhatsApp / SMS / Email)

| Attribute | Value |
|-----------|-------|
| **Priority** | P3 – Do after core features |
| **ROI** | High (proactive communication) |
| **Complexity** | High |
| **Dependencies** | Notification providers, contact data |

**Problem solved**
- Recipients and shippers are not proactively informed.
- Drivers must call manually; shippers poll for updates.

**Impact**
- Fewer inbound support calls.
- Better end-user experience.
- Enables delivery confirmation flows.

**Deliverables**
- Event triggers (e.g. pickup, delivery, status change).
- Channels: Email, SMS (Twilio), WhatsApp (Twilio/Meta).
- Preferences per user/shipment (opt-in, channel choice).
- Templates and localization.
- Queue for async sending and retries.

---

## Summary Table

| Feature | Problem | Impact | Dependencies |
|---------|---------|--------|--------------|
| Observability | No visibility into production | Debugging, SLAs, performance | None |
| Webhooks | Polling-only integrations | Real-time shipper integrations | None |
| Fleet subscriptions | No monetization model | Subscription revenue | Payment gateway |
| ETA estimation | No delivery time estimate | Better CX, less support | Tracking events |
| Notifications | No proactive updates | Less support, better UX | Providers, contact data |

---

## Suggested Phase 2 Order

1. **Observability** – Safe, low risk, enables everything else.
2. **Webhooks** – High value, moderate effort, no extra infra.
3. **ETA estimation** – Uses existing tracking; good UX gain.
4. **Fleet subscriptions** – Revenue driver; needs payment gateway.
5. **Notifications** – Strong impact; highest integration and ops load.
