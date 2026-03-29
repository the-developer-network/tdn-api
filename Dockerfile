FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apk add --no-cache openssl ca-certificates


FROM base AS build
WORKDIR /app


COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


COPY . .


RUN pnpm prisma generate
RUN pnpm build


FROM base AS runner
WORKDIR /app


ENV NODE_ENV=production


COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client

EXPOSE 3000

CMD ["node", "dist/index.js"]