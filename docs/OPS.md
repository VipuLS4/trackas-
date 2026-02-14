# TrackAS Operations Notes

## Observability (Phase 2)

### Structured Logging

- **Logger:** pino
- **Request ID:** `x-request-id` header (client-provided or auto-generated)
- **Per-request log:** `method`, `path`, `userId`, `role`, `statusCode`, `durationMs`
- **Error logs:** Include stack trace when an Error is passed

**Env:** `LOG_LEVEL` (default: `info`). Use `debug` for verbose logs.

**Development:** pino-pretty for human-readable output.  
**Production:** JSON to stdout (pipe to log aggregator if needed).

### Metrics (In-Process)

- **Counters:** `shipments_created_total`, `assignments_created_total`, `assignments_accepted_total`, `assignments_rejected_total`, `tracking_events_total{type=PICKUP|DELIVERY}`
- **Gauges:** `active_shipments` (status ≠ DELIVERED), `pending_assignments` (no acceptedAt/rejectedAt)
- **Histogram:** `assignment_accept_time_seconds` (duration of accept operation)

**Endpoint:** `GET /admin/metrics/technical` (ADMIN only)

**Scope:** In-process only. Resets on restart. No Prometheus/Datadog/Grafana.

### Correlation

Pass `x-request-id` from upstream (load balancer, gateway) to correlate logs across services.

---

## Webhooks

- **Delivery:** Fire-and-forget, async (setImmediate)
- **Retries:** 3 attempts, exponential backoff (1s, 2s, 4s)
- **Security:** HMAC-SHA256 in `X-TrackAS-Signature`; timestamp in `X-TrackAS-Timestamp` for replay protection
- **Failed deliveries:** Stored in `WebhookDelivery` with `status: failed`; no DLQ
