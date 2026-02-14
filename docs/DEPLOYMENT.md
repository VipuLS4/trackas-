# TrackAS Deployment Guide

## Overview

| Service  | Platform Options      | Notes                           |
|----------|------------------------|---------------------------------|
| Backend  | Railway / Render / Fly.io | NestJS + Prisma + PostgreSQL |
| Frontend | Vercel                | Next.js                         |
| Database | PostgreSQL            | Via platform or external (Neon, Supabase) |

---

## Environment Variables

### Backend (required)

| Variable      | Description                          | Example                                           |
|---------------|--------------------------------------|---------------------------------------------------|
| `DATABASE_URL`| PostgreSQL connection string         | `postgresql://user:pass@host:5432/db?schema=public` |
| `JWT_SECRET`  | Secret for JWT validation (min 32 chars) | Strong random string                          |
| `PORT`        | Server port (often set by platform)  | `3000`                                            |

### Frontend (required)

| Variable              | Description              | Example                              |
|-----------------------|--------------------------|--------------------------------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL     | `https://your-api.railway.app`       |

---

## 1. Backend Deployment

### Option A: Railway

1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Add **PostgreSQL** from Railway template
4. Select backend service → **Variables**:
   - `DATABASE_URL` – auto from PostgreSQL add-on (or `${{Postgres.DATABASE_URL}}`)
   - `JWT_SECRET` – generate: `openssl rand -base64 32`
   - `PORT` – usually set automatically
5. **Deploy** – Uses root `Dockerfile` and `railway.toml` (Docker builder forced)
6. Copy the generated URL (e.g. `https://trackas-api-production.up.railway.app`)

**Note:** `railway.toml` forces Docker; no Root Directory change needed.

### Option B: Render

1. Create account at [render.com](https://render.com)
2. New → **Web Service** → Connect repo
3. **Build**:
   - Root Directory: `backend/api`
   - Build Command: `npm ci && npm run build && npx prisma generate`
   - Start Command: `npx prisma migrate deploy && node dist/main.js`
4. Add **PostgreSQL** from Render Dashboard
5. **Environment**:
   - `DATABASE_URL` – from Render PostgreSQL
   - `JWT_SECRET` – `openssl rand -base64 32`
6. Deploy and copy the service URL

### Option C: Fly.io

1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/)
2. `cd backend/api && fly launch`
3. Add PostgreSQL: `fly postgres create` or use external (Neon/Supabase)
4. `fly secrets set DATABASE_URL="..." JWT_SECRET="..."`
5. Ensure `fly.toml` exposes port 3000
6. `fly deploy`

---

## 2. Database Migrations

Migrations run automatically when using the provided Dockerfile (`prisma migrate deploy` in CMD).

For platform builds without Docker:
```bash
npx prisma migrate deploy
```

---

## 2a. Seed Demo Data

To populate demo users, vehicles, and shipments for testing:

```bash
cd backend/api
npm run seed
```

Creates (idempotent – safe to re-run):
- 1 SHIPPER, 1 FLEET_OWNER, 1 DRIVER
- 2 Vehicles
- 2 Shipments (1 delivered with tracking events)

---

## 3. Frontend Deployment (Vercel)

1. Create account at [vercel.com](https://vercel.com)
2. **Import** your GitHub repo
3. **Configure**:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build` (default)
4. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = your backend URL (e.g. `https://trackas-api.railway.app`)
5. **Deploy**

Vercel will assign a URL like `https://trackas-xxx.vercel.app`.

---

## 4. CORS

Backend enables CORS. Set `FRONTEND_URL` (your Vercel URL) in backend env for production, or leave unset to allow all origins (`true`).

---

## 5. Local Docker Compose (Development Only)

Run backend, frontend, and PostgreSQL locally:

```bash
cd TrackAS
docker compose up --build
```

- Backend: http://localhost:3000
- Frontend: http://localhost:3001
- PostgreSQL: local connection (configure via DATABASE_URL in .env)

---

## 6. Live URLs

After deployment, record:

| Service  | URL |
|----------|-----|
| Backend  | `https://___________` |
| Frontend | `https://___________` |
| Database | (internal or connection string) |

---

## 7. Verification

1. **Backend health**: `curl https://your-backend-url/`
2. **Public tracking**: `curl https://your-backend-url/public/track/any-id` (404 for unknown id is OK)
3. **Frontend**: Open URL, try Login (paste JWT), Shipper, Driver, Public Track
