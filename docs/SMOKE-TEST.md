# TrackAS Post-Deploy Smoke Test Checklist

Replace `BASE_URL` with your deployed backend (e.g. `https://trackas-api.railway.app`).

**Prerequisites:** Generate JWTs for users with roles SHIPPER, DRIVER, ADMIN. Use [jwt.io](https://jwt.io) with payload `{ "sub": "<userId>" }` and your `JWT_SECRET`.

---

## 1. Auth with JWT

**Goal:** Protected endpoint accepts valid JWT.

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer YOUR_JWT" \
  "$BASE_URL/tracking/shipment/any-id"
```

- **Expected:** `403` (forbidden – wrong ownership) or `404` (shipment not found). Both indicate auth passed.
- **Fail:** `401` = invalid/missing JWT.

**Postman:** Use collection variable `token`, call any protected endpoint (e.g. GET /shipments). Should not return 401.

---

## 2. Shipper Creates Shipment

**Goal:** Shipper can create a shipment.

> **Note:** POST /shipments is planned but may not be implemented. If you get 404, skip this step.

```bash
curl -X POST "$BASE_URL/shipments" \
  -H "Authorization: Bearer SHIPPER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"shipperId":"SHIPPER_USER_ID"}'
```

- **Expected:** `201` with shipment object.
- **Alternative:** If 404, use existing shipment IDs from your DB for later steps.

**Postman:** POST /shipments (add request if missing), body `{"shipperId":"..."}`.

---

## 3. Shipper Lists Shipments

**Goal:** Shipper sees their shipments.

```bash
curl -s "$BASE_URL/shipments" \
  -H "Authorization: Bearer SHIPPER_JWT"
```

- **Expected:** `200` with array (may be empty).
- **Fail:** `403` = wrong role.

**Postman:** GET /shipments with SHIPPER token.

---

## 4. Driver Sees Assignments

**Goal:** Driver sees open assignments for their vehicle.

```bash
curl -s "$BASE_URL/assignments/my" \
  -H "Authorization: Bearer DRIVER_JWT"
```

- **Expected:** `200` with array of assignments (may be empty if none pending).
- **Fail:** `403` = wrong role.

**Postman:** GET /assignments/my with DRIVER token.

---

## 5. Accept / Reject Assignment

**Goal:** Driver or fleet owner can accept or reject an assignment.

Replace `ASSIGNMENT_ID` with an ID from GET /assignments/my.

```bash
# Accept
curl -X POST "$BASE_URL/assignments/ASSIGNMENT_ID/accept" \
  -H "Authorization: Bearer DRIVER_JWT"

# Reject
curl -X POST "$BASE_URL/assignments/ASSIGNMENT_ID/reject" \
  -H "Authorization: Bearer DRIVER_JWT"
```

- **Expected:** `200` with updated assignment (`acceptedAt` or `rejectedAt` set).
- **Fail:** `400` = already accepted/rejected or expired; `403` = not allowed; `404` = assignment not found.

**Postman:** POST /assignments/:id/accept and POST /assignments/:id/reject with `assignmentId` variable.

---

## 6. Tracking Pickup & Delivery

**Goal:** DRIVER/ADMIN can record PICKUP and DELIVERY events.

Replace `SHIPMENT_ID` with a valid shipment ID.

```bash
# Pickup
curl -X POST "$BASE_URL/tracking" \
  -H "Authorization: Bearer DRIVER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"shipmentId":"SHIPMENT_ID","eventType":"PICKUP","latitude":52.52,"longitude":13.405}'

# Delivery
curl -X POST "$BASE_URL/tracking" \
  -H "Authorization: Bearer DRIVER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"shipmentId":"SHIPMENT_ID","eventType":"DELIVERY","latitude":52.53,"longitude":13.41}'
```

- **Expected:** `201` with tracking event.
- **Effects:** PICKUP → `shipment.status = PICKUP_CONFIRMED`; DELIVERY → `shipment.status = DELIVERED`.

**Postman:** POST /tracking with body for Record Pickup and Record Delivery.

---

## 7. Payment Auto-Releases

**Goal:** After DELIVERY, payment status becomes RELEASED.

```bash
curl -s "$BASE_URL/payments/shipment/SHIPMENT_ID" \
  -H "Authorization: Bearer ADMIN_JWT"
```

- **Expected:** `200` with `"status":"RELEASED"` after a DELIVERY event was recorded.
- **Note:** Payment must exist for the shipment. Auto-release runs when DELIVERY is recorded in step 6.

**Postman:** GET /payments/shipment/:shipmentId with ADMIN token.

---

## 8. Public Tracking Works

**Goal:** Unauthenticated request returns tracking data.

```bash
curl -s "$BASE_URL/public/track/SHIPMENT_ID"
```

- **Expected:** `200` with `shipmentId`, `status`, `trackingEvents`, `vehicle` (masked plate), `eta`.
- **Fail:** `404` = shipment not found.

**Postman:** Public Tracking request (no auth), set `shipmentId`.

---

## 9. Admin Metrics Load

**Goal:** ADMIN can fetch overview and funnel.

```bash
# Overview
curl -s "$BASE_URL/admin/metrics/overview" \
  -H "Authorization: Bearer ADMIN_JWT"

# Funnel
curl -s "$BASE_URL/admin/metrics/funnel" \
  -H "Authorization: Bearer ADMIN_JWT"
```

- **Expected:** `200` with counts and funnel steps.
- **Fail:** `403` = not ADMIN.

**Postman:** Admin Metrics → Overview and Funnel with ADMIN token.

---

## Summary

| # | Step                  | Endpoint(s)                    | Role    |
|---|-----------------------|--------------------------------|---------|
| 1 | Auth with JWT         | Any protected                  | Any     |
| 2 | Shipper creates       | POST /shipments                | SHIPPER |
| 3 | Shipper lists         | GET /shipments                 | SHIPPER |
| 4 | Driver sees assignments | GET /assignments/my          | DRIVER  |
| 5 | Accept / Reject       | POST /assignments/:id/accept, reject | DRIVER / FLEET_OWNER |
| 6 | Tracking pickup/delivery | POST /tracking              | DRIVER / ADMIN |
| 7 | Payment auto-releases | GET /payments/shipment/:id    | ADMIN   |
| 8 | Public tracking       | GET /public/track/:id         | (none)  |
| 9 | Admin metrics         | GET /admin/metrics/overview, funnel | ADMIN |

---

## Quick Health Check

```bash
curl -s "$BASE_URL/"
# Expected: "Hello World!"
```
