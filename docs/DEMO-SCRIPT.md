# TrackAS Demo Script (10–15 minutes)

## Prerequisites

- Backend and frontend running (local or deployed)
- **Pre-seeded data:** At least one shipment, one vehicle with a driver, and one open assignment (or use your seed script)
- JWTs for: SHIPPER, ADMIN, DRIVER (generate via jwt.io with `{ "sub": "<userId>" }`)
- Log in to the frontend and paste each role’s JWT as needed

---

## 1. Shipper Creates Shipment (1–2 min)

**UI:** Frontend → Shipper Dashboard → Create Shipment

**Flow:**
1. Log in as SHIPPER.
2. Go to Shipper Dashboard.
3. Enter shipper user ID and submit the Create Shipment form.

**Talking points:**
- Shipper initiates the delivery.
- Shipment starts in `PENDING` and then moves to `ASSIGNMENT_PENDING` once the assignment flow runs.
- **Note:** POST /shipments may not be implemented yet; if so, use a pre-seeded shipment.

**API (optional):**
```bash
curl -X POST "$API_URL/shipments" \
  -H "Authorization: Bearer SHIPPER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"shipperId":"SHIPPER_USER_ID"}'
```

---

## 2. Admin Assigns Vehicle (1–2 min)

**UI:** Frontend → (Admin section) or Postman

**Flow:**
1. Log in as ADMIN.
2. Go to Vehicles (or use Postman).
3. Assign a driver to a vehicle: `POST /vehicles/:vehicleId/assign-driver` with `{ "driverId": "DRIVER_USER_ID" }`.

**Talking points:**
- Admin links a driver to a vehicle so the driver can receive assignments.
- Driver must exist and vehicle must be created (by FLEET_OWNER or INDIVIDUAL_OWNER).

**API:**
```bash
curl -X POST "$API_URL/vehicles/VEHICLE_ID/assign-driver" \
  -H "Authorization: Bearer ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"driverId":"DRIVER_USER_ID"}'
```

---

## 3. Driver Accepts Assignment (1–2 min)

**UI:** Frontend → Driver Dashboard

**Flow:**
1. Log in as DRIVER.
2. Go to Driver Dashboard.
3. Click **Load My Assignments**.
4. Review the open assignment.
5. Click **Accept**.

**Talking points:**
- Driver sees only assignments for their vehicle (`GET /assignments/my`).
- Only open assignments (no `acceptedAt`, no `rejectedAt`, not expired) are shown.
- On reject or expiry, shipment returns to `ASSIGNMENT_PENDING` and the system auto-assigns the next vehicle.

**API:**
```bash
curl -X POST "$API_URL/assignments/ASSIGNMENT_ID/accept" \
  -H "Authorization: Bearer DRIVER_JWT"
```

---

## 4. Driver Marks Pickup and Delivery (2–3 min)

**UI:** Postman or similar API client (tracking events are not in the frontend yet)

**Flow:**
1. Log in as DRIVER (JWT in Postman).
2. **Pickup:** `POST /tracking` with `eventType: "PICKUP"`, `shipmentId`, `latitude`, `longitude`.
3. **Delivery:** `POST /tracking` with `eventType: "DELIVERY"`, same shipment, new coordinates.

**Talking points:**
- Pickup updates shipment status to `PICKUP_CONFIRMED`.
- Delivery updates shipment status to `DELIVERED` and triggers payment release.
- Events are append-only and immutable.

**API:**
```bash
# Pickup
curl -X POST "$API_URL/tracking" \
  -H "Authorization: Bearer DRIVER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"shipmentId":"SHIPMENT_ID","eventType":"PICKUP","latitude":52.52,"longitude":13.405}'

# Delivery
curl -X POST "$API_URL/tracking" \
  -H "Authorization: Bearer DRIVER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"shipmentId":"SHIPMENT_ID","eventType":"DELIVERY","latitude":52.53,"longitude":13.41}'
```

---

## 5. Payment Auto-Releases (1 min)

**UI:** Postman – `GET /payments/shipment/:shipmentId`

**Flow:**
1. Log in as ADMIN.
2. Call `GET /payments/shipment/SHIPMENT_ID`.

**Talking points:**
- Payment starts in `HELD`.
- On DELIVERY, the backend sets payment status to `RELEASED`.
- No separate release API in Phase 1 – release is automatic.

**API:**
```bash
curl "$API_URL/payments/shipment/SHIPMENT_ID" \
  -H "Authorization: Bearer ADMIN_JWT"
# Expect "status": "RELEASED" after delivery
```

---

## 6. Customer Tracks Publicly (1–2 min)

**UI:** Frontend → Public Track

**Flow:**
1. Open Public Track (no login).
2. Enter the shipment ID from step 1.
3. Click **Track**.

**Talking points:**
- No auth required.
- Response includes status, ordered tracking events, masked plate number.
- No user IDs, driver phone, or payment data exposed.

**API:**
```bash
curl "$API_URL/public/track/SHIPMENT_ID"
```

---

## 7. Admin Views Metrics (1–2 min)

**UI:** Postman – Admin Metrics

**Flow:**
1. Log in as ADMIN.
2. Call `GET /admin/metrics/overview`.
3. Call `GET /admin/metrics/funnel`.

**Talking points:**
- Overview: counts for shipments, vehicles, users, assignments; breakdown by status.
- Funnel: shipment status progression (PENDING → ASSIGNMENT_PENDING → … → DELIVERED).
- Data from Prisma aggregations (count, groupBy), ready for dashboards.

**API:**
```bash
curl "$API_URL/admin/metrics/overview" -H "Authorization: Bearer ADMIN_JWT"
curl "$API_URL/admin/metrics/funnel" -H "Authorization: Bearer ADMIN_JWT"
```

---

## Timing Overview

| Step | Duration |
|------|----------|
| 1. Shipper creates shipment | 1–2 min |
| 2. Admin assigns vehicle | 1–2 min |
| 3. Driver accepts assignment | 1–2 min |
| 4. Driver marks pickup & delivery | 2–3 min |
| 5. Payment auto-releases | 1 min |
| 6. Customer tracks publicly | 1–2 min |
| 7. Admin views metrics | 1–2 min |
| **Total** | **10–15 min** |

---

## Quick Reference: IDs Needed

| Role | ID / Variable |
|------|----------------|
| Shipper | `SHIPPER_USER_ID` |
| Driver | `DRIVER_USER_ID` |
| Admin | `ADMIN_JWT` |
| Shipment | From step 1 or seed |
| Vehicle | From Vehicles list |
| Assignment | From GET /assignments/my |
