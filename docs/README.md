# TrackAS API Consumption & Documentation

This folder contains API documentation and a Postman collection for validating the backend.

## Files

| File | Description |
|------|-------------|
| [API.md](./API.md) | Full API reference with request/response examples |
| [AUTH-FLOW.md](./AUTH-FLOW.md) | JWT authentication flow and testing instructions |
| [TrackAS-API.postman_collection.json](./TrackAS-API.postman_collection.json) | Postman v2.1 collection |

## Quick Start

1. **Start the backend**: `cd backend/api && npm run start:dev`
2. **Obtain a JWT** (see [AUTH-FLOW.md](./AUTH-FLOW.md)) using an existing user ID
3. **Import the Postman collection** and set variables:
   - `baseUrl`: `http://localhost:3000`
   - `token`: your JWT
   - `shipmentId`, `vehicleId`, `driverId`, `assignmentId`: IDs for testing
4. **Run requests** – Public endpoints work without a token; all others need `token` set

## Endpoint Overview

| Area | Endpoints |
|------|-----------|
| Public | GET /, GET /public/track/:shipmentId |
| Vehicles | POST /vehicles, GET /vehicles, POST /vehicles/:id/assign-driver |
| Tracking | POST /tracking, GET /tracking/shipment/:shipmentId |
| Assignments | POST /assignments/:id/accept, POST /assignments/:id/reject |
| Payments | GET /payments/shipment/:shipmentId |
| Admin | GET /admin/metrics/overview, GET /admin/metrics/funnel |

## Notes

- Register and login are **not** in this backend; tokens come from your auth service
- Planned APIs (auth register/login, shipment CRUD) are documented in [API.md](./API.md) under "Planned APIs"
