FROM node:20-alpine

WORKDIR /app

# Copy package files from backend/api
COPY backend/api/package*.json ./

RUN npm install

# Copy full backend source
COPY backend/api/ .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS app
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
