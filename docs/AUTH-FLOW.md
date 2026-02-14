# TrackAS – JWT Auth Flow

## Overview

All protected endpoints require a valid JWT in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

The backend **validates** tokens; it does **not** issue them. Register and login are provided by your auth service.

---

## JWT Structure

- **Header**: `{ "alg": "HS256", "typ": "JWT" }`
- **Payload**: Must include `sub` (user ID string)
- **Secret**: `JWT_SECRET` from environment

---

## Obtaining a Token for Testing

### 1. Using jwt.io

1. Go to [jwt.io](https://jwt.io)
2. Select algorithm **HS256**
3. **Payload** – use an existing user ID from your database:
   ```json
   { "sub": "clx123abc456" }
   ```
4. **Verify Signature** – enter your `JWT_SECRET` (same as `.env`)
5. Copy the encoded token from the left panel

### 2. Using Node.js

```javascript
const jwt = require('jsonwebtoken');

const userId = 'clx123abc456'; // existing user ID
const secret = process.env.JWT_SECRET || 'change-me-in-production';
const token = jwt.sign({ sub: userId }, secret, { expiresIn: '1h' });
console.log(token);
```

### 3. Using Postman

1. Import `TrackAS-API.postman_collection.json`
2. Set collection variable `token` to your JWT
3. The collection uses Bearer auth with `{{token}}`
4. Set `shipmentId`, `vehicleId`, `driverId`, `assignmentId` as needed for requests

---

## Flow Summary

```
┌─────────────┐     register/login      ┌─────────────┐
│   Client    │ ──────────────────────▶ │ Auth Service│
│             │ ◀────────────────────── │ (external)  │
│             │    { accessToken }      └─────────────┘
└──────┬──────┘
       │
       │  Authorization: Bearer <token>
       ▼
┌─────────────┐
│  TrackAS    │  validates JWT, loads user, enforces roles
│  Backend    │
└─────────────┘
```

---

## Public Endpoints (No Token)

- `GET /` – health
- `GET /public/track/:shipmentId` – public tracking

---

## Role-Based Access

| Endpoint | Roles |
|----------|-------|
| POST /vehicles | FLEET_OWNER, INDIVIDUAL_OWNER |
| GET /vehicles | ADMIN, FLEET_OWNER, INDIVIDUAL_OWNER |
| POST /vehicles/:id/assign-driver | ADMIN |
| POST /tracking | DRIVER, ADMIN |
| GET /tracking/shipment/:id | ADMIN, SHIPPER (owner), DRIVER (assigned) |
| POST /assignments/:id/accept | DRIVER, FLEET_OWNER (with ownership) |
| POST /assignments/:id/reject | DRIVER, FLEET_OWNER (with ownership) |
| GET /payments/shipment/:id | ADMIN, SHIPPER (owner), DRIVER (assigned) |
| GET /admin/metrics/* | ADMIN |
