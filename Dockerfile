# syntax=docker/dockerfile:1

# Stage 1: Base Alpine Environment
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl

# Stage 2: Install Dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# Stage 3: Build Next.js 15 Application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx prisma generate
RUN npm run build

# Stage 4: Production Runner Container
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /app/prisma && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
