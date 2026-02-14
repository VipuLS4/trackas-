# Railway / production build - builds backend from backend/api
FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/api/package*.json ./
COPY backend/api/prisma ./prisma/
RUN npm ci
RUN npx prisma generate

COPY backend/api/ ./
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma/

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
