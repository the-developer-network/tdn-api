FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
# Runtime-only native deps (OpenSSL for Prisma engine, CA certs for TLS)
RUN apk add --no-cache openssl ca-certificates

FROM base AS build
WORKDIR /app
# Native build tools needed only at compile time (argon2 fallback, node-gyp)
RUN apk add --no-cache python3 make g++

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

RUN pnpm prisma generate
RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
# patches/ is required by pnpm for patchedDependencies declared in package.json
COPY patches/ ./patches/
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

# Run as non-root for security (node user ships with node:alpine)
USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]