# ============================================================================
# Next.js app image (dev server) for the self-contained docker stack
# ============================================================================
#
# Runs `next dev` bound to 0.0.0.0 so the container is reachable from the host.
# The same image is reused by the one-shot `seed-images` service (it just runs
# a node script instead of the dev server).
#
# Node 24 matches the host toolchain. Deps install with --legacy-peer-deps
# because the project intentionally relies on it (see @langchain/core).

FROM node:24-bookworm-slim

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# App source (node_modules / .env excluded via .dockerignore).
COPY . .

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3202

# Bind to all interfaces so the published port works from the host.
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]
