# TrackAS API Documentation

Base URL: Set via deployment (e.g. `http://localhost:3000` for local dev, `https://your-api.railway.app` for production)

## Authentication

All protected endpoints require a JWT in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### JWT Requirements

- **Issuer**: Tokens are issued by an external auth provider (this backend validates only).
- **Payload**: Must include `sub` (user ID). Example: `{ "sub": "clx123abc" }`
- **Validation**: Backend loads the user by `sub` and attaches `{ id, role }` to the request.

### Auth Endpoints (External)

Register and login are not part of this API. They are provided by your auth service. When you implement them, the login response should return a JWT with payload `{ sub: userId }`.

### Testing: Generate a JWT

For local testing, generate a token using [jwt.io](https://jwt.io):

1. **Payload** (use an existing user ID from your DB):
   ```json
   { "sub": "clx123abc456" }
   ```

2. **Secret**: Same as `JWT_SECRET` in your `.env` (required)

3. **Algorithm**: HS256

Or use a script (Node.js):

```javascript
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { sub: 'clx123abc456' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);
console.log(token);
```

---

## Public Endpoints (No Auth)

### GET /

Health check endpoint. Used by Railway and similar platforms for liveness checks.

**Response 200:**
```json
{
  "status": "ok",
  "version": "0.0.1"
}
```

| Field   | Type   | Description                                  |
|---------|--------|----------------------------------------------|
| status  | string | Always `"ok"`                                |
| version | string | From `APP_VERSION` env or default `"0.0.1"`  |

---

### GET /public/track/:shipmentId

Public shipment tracking. No authentication.

**Path params:**
| Param       | Type   | Description |
|-------------|--------|-------------|
| shipmentId  | string | Shipment ID |

**Response 200:**
```json
{
  "shipmentId": "clx123",
  "status": "IN_TRANSIT",
  "trackingEvents": [
    {
      "eventType": "PICKUP",
      "latitude": 52.52,
      "longitude": 13.405,
      "createdAt": "2025-02-07T12:00:00.000Z"
    }
  ],
  "vehicle": {
    "plateNumberMasked": "AB**23"
  },
  "eta": "2025-02-07T14:30:00.000Z"
}
```

**ETA (Estimated Arrival Time):**
| Value   | When |
|---------|------|
| `null`  | No pickup yet, or no delivery destination, or already delivered |
| ISO str | After pickup; computed from distance (Haversine) and configurable average speed |

Config: `ETA_AVERAGE_SPEED_KMH` (default 50). Shipment must have `deliveryLatitude` and `deliveryLongitude` set for ETA to be computed.

---

## Protected Endpoints

All endpoints below require `Authorization: Bearer <token>` unless noted.

---

## Vehicles

### POST /vehicles

**Roles:** FLEET_OWNER, INDIVIDUAL_OWNER

**Request:**
```json
{
  "plateNumber": "AB 123 CD",
  "make": "Toyota",
  "model": "Hiace"
}
```

| Field       | Type   | Required | Description        |
|-------------|--------|----------|--------------------|
| plateNumber | string | Yes      | 1–32 chars         |
| make        | string | No       | Max 64 chars       |
| model       | string | No       | Max 64 chars       |

**Response 201:**
```json
{
  "id": "clx456",
  "ownerId": "clx123",
  "driverId": null,
  "plateNumber": "AB 123 CD",
  "make": "Toyota",
  "model": "Hiace"
}
```

---

### GET /vehicles

**Roles:**
- ADMIN: all vehicles
- FLEET_OWNER / INDIVIDUAL_OWNER: own vehicles only

**Response 200:**
```json
[
  {
    "id": "clx456",
    "ownerId": "clx123",
    "driverId": "clx789",
    "plateNumber": "AB 123 CD",
    "make": "Toyota",
    "model": "Hiace",
    "owner": { "id": "clx123", "email": "owner@example.com" },
    "driver": { "id": "clx789", "email": "driver@example.com" }
  }
]
```

---

### POST /vehicles/:id/assign-driver

**Roles:** ADMIN

**Path params:** `id` = vehicle ID

**Request:**
```json
{
  "driverId": "clx789"
}
```

**Response 200:**
```json
{
  "id": "clx456",
  "ownerId": "clx123",
  "driverId": "clx789",
  "plateNumber": "AB 123 CD",
  "owner": { "id": "clx123", "email": "owner@example.com" },
  "driver": { "id": "clx789", "email": "driver@example.com" }
}
```

---

## Tracking

### POST /tracking

**Roles:** DRIVER, ADMIN

**Request:**
```json
{
  "shipmentId": "clx111",
  "eventType": "PICKUP",
  "latitude": 52.52,
  "longitude": 13.405
}
```

| Field      | Type   | Required | Description                    |
|------------|--------|----------|--------------------------------|
| shipmentId | string | Yes      | Shipment ID                    |
| eventType  | string | Yes      | `PICKUP` or `DELIVERY`         |
| latitude   | number | Yes      | -90 to 90                      |
| longitude  | number | Yes      | -180 to 180                    |

**Effects:**
- `PICKUP` → `shipment.status = PICKUP_CONFIRMED`
- `DELIVERY` → `shipment.status = DELIVERED`, payment released

**Response 201:**
```json
{
  "id": "clxevt1",
  "shipmentId": "clx111",
  "eventType": "PICKUP",
  "latitude": 52.52,
  "longitude": 13.405,
  "createdAt": "2025-02-07T12:00:00.000Z",
  "createdById": "clx789",
  "shipment": { "id": "clx111", "status": "PICKUP_CONFIRMED" }
}
```

---

### GET /tracking/shipment/:shipmentId

**Roles:** ADMIN (all), SHIPPER (owns shipment), DRIVER (assigned)

**Response 200:**
```json
[
  {
    "id": "clxevt1",
    "shipmentId": "clx111",
    "eventType": "PICKUP",
    "latitude": 52.52,
    "longitude": 13.405,
    "createdAt": "2025-02-07T12:00:00.000Z"
  },
  {
    "id": "clxevt2",
    "shipmentId": "clx111",
    "eventType": "DELIVERY",
    "latitude": 52.53,
    "longitude": 13.41,
    "createdAt": "2025-02-07T14:30:00.000Z"
  }
]
```

---

## Shipments

### GET /shipments

**Roles:** SHIPPER

Returns shipments where `shipperId` = current user.

**Response 200:**
```json
[
  {
    "id": "clx111",
    "status": "IN_TRANSIT",
    "shipperId": "clx123",
    "driverId": "clx789",
    "deliveryLatitude": 52.53,
    "deliveryLongitude": 13.41,
    "shipper": { "id": "clx123", "email": "shipper@example.com" },
    "driver": { "id": "clx789", "email": "driver@example.com" },
    "eta": "2025-02-07T14:30:00.000Z"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| eta | string \| null | Estimated arrival time (ISO string). `null` if no pickup, no delivery destination, or already delivered. Computed on read. |

---

## Assignments

### GET /assignments/my

**Roles:** DRIVER

Returns open assignments where `vehicle.driverId` = current user, `acceptedAt` is null, `rejectedAt` is null.

**Response 200:**
```json
[
  {
    "id": "clxassign1",
    "shipmentId": "clx111",
    "vehicleId": "clx456",
    "expiresAt": "2025-02-07T12:30:00.000Z",
    "acceptedAt": null,
    "rejectedAt": null,
    "shipment": { "id": "clx111", "status": "ASSIGNMENT_PENDING", ... },
    "vehicle": { "id": "clx456", "plateNumber": "AB 123 CD", ... }
  }
]
```

---

### POST /assignments/:id/accept

**Roles:** DRIVER (assigned to vehicle), FLEET_OWNER (owns vehicle)

**Path params:** `id` = assignment ID

**Conditions:** Assignment must not be expired (`expiresAt > now`), and not already accepted/rejected.

**Response 200:**
```json
{
  "id": "clxassign1",
  "shipmentId": "clx111",
  "vehicleId": "clx456",
  "expiresAt": "2025-02-07T12:30:00.000Z",
  "acceptedAt": "2025-02-07T12:05:00.000Z",
  "rejectedAt": null,
  "shipment": { ... },
  "vehicle": { ... }
}
```

**Errors:**
- `400 Bad Request`: Assignment expired, already accepted, or already rejected
- `403 Forbidden`: Not allowed to accept (wrong role/ownership)

---

### POST /assignments/:id/reject

**Roles:** Same as accept

**Response 200:**
```json
{
  "id": "clxassign1",
  "shipmentId": "clx111",
  "vehicleId": "clx456",
  "expiresAt": "2025-02-07T12:30:00.000Z",
  "acceptedAt": null,
  "rejectedAt": "2025-02-07T12:05:00.000Z",
  ...
}
```

**Effects:** Sets `rejectedAt`, `shipment.status = ASSIGNMENT_PENDING`, triggers auto re-assignment.

---

## Payments

### GET /payments/shipment/:shipmentId

**Roles:** ADMIN (all), SHIPPER (owns shipment), DRIVER (assigned)

**Response 200:**
```json
{
  "id": "clxpay1",
  "shipmentId": "clx111",
  "status": "HELD"
}
```

---

## Webhooks

**Role:** SHIPPER only. Shippers subscribe to receive real-time shipment lifecycle updates via HTTPS POST.

### POST /webhooks

Create a webhook subscription.

**Request:**
```json
{
  "url": "https://your-server.com/webhooks/trackas",
  "secret": "your-min-16-char-secret"
}
```

| Field  | Type   | Required | Description                    |
|--------|--------|----------|--------------------------------|
| url    | string | Yes      | HTTPS endpoint to receive POST |
| secret | string | Yes      | Min 16 chars; used for HMAC    |

**Response 201:**
```json
{
  "id": "clx...",
  "shipperId": "clx...",
  "url": "https://your-server.com/webhooks/trackas",
  "enabled": true,
  "createdAt": "2025-02-07T12:00:00.000Z"
}
```

---

### GET /webhooks

List webhook subscriptions for the current shipper.

**Response 200:**
```json
[
  {
    "id": "clx...",
    "shipperId": "clx...",
    "url": "https://...",
    "enabled": true,
    "createdAt": "2025-02-07T12:00:00.000Z"
  }
]
```

---

### DELETE /webhooks/:id

Disable a webhook subscription (sets `enabled: false`).

**Response 200:** Updated subscription object.

---

### Webhook delivery

- **Method:** POST
- **Headers:** `Content-Type: application/json`, `X-TrackAS-Signature`, `X-TrackAS-Timestamp`
- **Body:** JSON payload
- **Retry:** 3 attempts with exponential backoff (1s, 2s, 4s)
- **Signature:** HMAC-SHA256 of `{timestamp}.{body}` with your secret, sent as `sha256={hex}`

**Payload format:**
```json
{
  "event": "assignment.accepted",
  "timestamp": "2025-02-07T12:00:00.000Z",
  "data": {
    "shipmentId": "clx...",
    "assignmentId": "clx..."
  }
}
```

**Events:**
| Event                   | When emitted                          | data keys        |
|-------------------------|---------------------------------------|------------------|
| shipment.created        | Shipment created (when API added)     | shipmentId       |
| assignment.accepted     | Driver/fleet owner accepts assignment | shipmentId, assignmentId |
| assignment.rejected     | Assignment rejected                   | shipmentId, assignmentId |
| shipment.pickup_confirmed | PICKUP tracking event recorded      | shipmentId       |
| shipment.delivered      | DELIVERY tracking event recorded      | shipmentId       |

**Verification (receiver):** Check `X-TrackAS-Timestamp` is recent; compute HMAC-SHA256(`{timestamp}.{rawBody}`, secret) and compare to `X-TrackAS-Signature`.

---

## Admin Metrics

**Roles:** ADMIN only

### GET /admin/metrics/overview

**Response 200:**
```json
{
  "totalShipments": 42,
  "totalVehicles": 5,
  "totalUsers": 12,
  "totalAssignments": 18,
  "shipmentsByStatus": {
    "PENDING": 2,
    "ASSIGNMENT_PENDING": 1,
    "PICKUP_CONFIRMED": 3,
    "IN_TRANSIT": 5,
    "DELIVERED": 31
  },
  "paymentsByStatus": {
    "HELD": 6,
    "RELEASED": 36
  }
}
```

---

### GET /admin/metrics/funnel

**Response 200:**
```json
{
  "funnel": [
    { "status": "PENDING", "count": 1 },
    { "status": "ASSIGNMENT_PENDING", "count": 1 },
    { "status": "PICKUP_CONFIRMED", "count": 3 },
    { "status": "IN_TRANSIT", "count": 5 },
    { "status": "DELIVERED", "count": 31 }
  ]
}
```

---

### GET /admin/metrics/technical

Operational metrics (counters, gauges, histogram). In-process, no external SaaS.

**Response 200:**
```json
{
  "counters": {
    "shipments_created_total": 0,
    "assignments_created_total": 5,
    "assignments_accepted_total": 3,
    "assignments_rejected_total": 2,
    "tracking_events_total{\"type\":\"PICKUP\"}": 10,
    "tracking_events_total{\"type\":\"DELIVERY\"}": 8
  },
  "gauges": {
    "active_shipments": 4,
    "pending_assignments": 1
  },
  "histogram": {
    "assignment_accept_time_seconds": {
      "0.001": 0,
      "0.005": 2,
      "0.01": 3,
      "0.025": 3,
      "0.05": 3,
      "0.1": 3,
      "0.25": 3,
      "0.5": 3,
      "1": 3,
      "2.5": 3,
      "5": 3,
      "10": 3,
      "+Inf": 3
    }
  }
}
```

---

## ETA Estimation (v1)

Simple, deterministic ETA computed on read. No external map APIs, no ML.

**Logic:**
1. No pickup event → `eta = null`
2. Status = DELIVERED → `eta = null`
3. No delivery destination (`deliveryLatitude`/`deliveryLongitude` on Shipment) → `eta = null`
4. Otherwise: `distance(lastKnownLocation, delivery) / averageSpeed` → ETA = last event time + travel time

**Distance:** Haversine formula (straight-line, km). **Speed:** Configurable via `ETA_AVERAGE_SPEED_KMH` (default 50 km/h).

**Exposed in:** `GET /public/track/:shipmentId`, `GET /shipments` (shipper).

---

## Planned APIs (Not Implemented)

These endpoints are not in the current backend. Expected contracts when implemented:

### Auth: POST /auth/register
```json
// Request
{ "email": "user@example.com", "password": "...", "role": "SHIPPER" }
// Response 201
{ "id": "clx123", "email": "user@example.com", "role": "SHIPPER" }
```

### Auth: POST /auth/login
```json
// Request
{ "email": "user@example.com", "password": "..." }
// Response 200
{ "accessToken": "eyJhbGc...", "expiresIn": 3600 }
```

### Shipments: POST /shipments
```json
// Request (shipper creates)
{ "shipperId": "clx123", "deliveryLatitude": 52.53, "deliveryLongitude": 13.41 }
// Response 201
{ "id": "clx111", "status": "PENDING", "shipperId": "clx123", "deliveryLatitude": 52.53, "deliveryLongitude": 13.41 }
```
Note: `deliveryLatitude` and `deliveryLongitude` are optional; when provided, ETA can be computed after pickup.

### Shipments: GET /shipments/:id
```json
// Response 200
{ "id": "clx111", "status": "PENDING", "shipperId": "clx123", "driverId": null, ... }
```

---

## Error Responses

| Status | Description |
|--------|-------------|
| 400   | Validation error, bad request |
| 401   | Missing or invalid JWT |
| 403   | Forbidden (role or ownership) |
| 404   | Resource not found |

Example validation error:
```json
{
  "statusCode": 400,
  "message": ["eventType must be PICKUP or DELIVERY"],
  "error": "Bad Request"
}
```

---

## Roles Reference

| Role            | Description                    |
|-----------------|--------------------------------|
| ADMIN           | Full access                    |
| SHIPPER         | Own shipments                  |
| DRIVER          | Assigned shipments, tracking   |
| FLEET_OWNER     | Own vehicles                   |
| INDIVIDUAL_OWNER| Own vehicles                   |
