# Multi-stage build for production
# Use Debian-based image for better Prisma compatibility
FROM node:20-slim AS base

# Build stage - install dependencies and build
FROM base AS builder
WORKDIR /app

# Copy package files for workspace resolution
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/data-import/package.json ./packages/data-import/
COPY packages/agents/package.json ./packages/agents/

# Install all dependencies (needed for workspace resolution and build)
RUN npm ci

# Copy source files
COPY . .

# Generate Prisma Client first (needed by other packages)
RUN cd packages/database && npm run db:generate

# Build packages (in order of dependencies)
RUN npm run build --workspace=@soul-kg-crm/shared
RUN npm run build --workspace=@soul-kg-crm/database
RUN npm run build --workspace=@soul-kg-crm/agents
RUN npm run build --workspace=@soul-kg-crm/data-import
RUN npm run build --workspace=@soul-kg-crm/api

# Remove dev dependencies
RUN npm prune --production

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Install OpenSSL for Prisma and Chromium for Puppeteer
RUN apt-get update && apt-get install -y \
    openssl \
    chromium \
    chromium-sandbox \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set Chromium as Puppeteer executable
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy package files for workspace resolution
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/package-lock.json* ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package.json ./apps/api/
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/package.json ./packages/database/
COPY --from=builder --chown=nodejs:nodejs /app/packages/data-import/package.json ./packages/data-import/
COPY --from=builder --chown=nodejs:nodejs /app/packages/agents/package.json ./packages/agents/

# Copy built files
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/dist ./packages/database/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/data-import/dist ./packages/data-import/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/agents/dist ./packages/agents/dist

# Copy Prisma schema and generated client
COPY --from=builder --chown=nodejs:nodejs /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy production node_modules (after prune)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

USER nodejs

EXPOSE 3001

# Health check (Railway uses its own healthcheck, but this is for Docker)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"

CMD ["node", "apps/api/dist/index.js"]
