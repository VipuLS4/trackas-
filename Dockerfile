# Railway / production - builds backend from backend/api
FROM node:20

WORKDIR /app

COPY backend/api/package*.json ./
COPY backend/api/prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY backend/api/ ./

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
