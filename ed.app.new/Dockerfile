# syntax=docker/dockerfile:1
# ============================================================
# EverDream (Lucid) — production image
# Multi-stage: Vite build -> static nginx serve
# ============================================================

# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# ONLY these two PUBLIC vars are accepted at build time. They are safe to
# embed in the client bundle. AI provider keys are intentionally NOT declared
# here, so Vite cannot inline them — they live as Supabase edge-function
# secrets instead. See scripts/assert-no-secrets-in-dist.sh for enforcement.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Install deps against the locked manifest (reproducible)
COPY package.json package-lock.json ./
RUN npm ci

# Build
COPY . .
RUN npm run build

# Fail the build if any provider key leaked into the bundle
RUN sh scripts/assert-no-secrets-in-dist.sh dist

# ---- Serve stage ----
FROM nginx:1.27-alpine AS serve
RUN rm -rf /usr/share/nginx/html/*
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
