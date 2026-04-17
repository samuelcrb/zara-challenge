# ── Stage 1: build frontend ──────────────────────────────────────────────────
FROM node:18-slim AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: build backend ───────────────────────────────────────────────────
FROM node:18-slim AS backend-builder
WORKDIR /build
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# ── Stage 3: production runtime ──────────────────────────────────────────────
FROM node:18-slim AS runtime

# sharp needs these system libs on Debian slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install only production dependencies
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Backend compiled output
COPY --from=backend-builder /build/dist ./dist

# Frontend static files — server expects them at <cwd>/frontend/dist
COPY --from=frontend-builder /build/dist ./frontend/dist

EXPOSE 3000

CMD ["node", "--max-old-space-size=400", "dist/server.js"]
