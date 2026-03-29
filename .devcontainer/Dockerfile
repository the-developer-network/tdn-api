FROM mcr.microsoft.com/devcontainers/javascript-node:1-24-bookworm

RUN corepack enable && corepack prepare pnpm@latest --activate

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends python3 make g++ openssl

EXPOSE 3000