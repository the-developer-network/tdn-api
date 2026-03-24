<div align="center">

<br/>

# TDN-API

**The backend API powering The Developer Network —**  
**a community platform built for developers, by developers.**

<br/>

`Node.js` &nbsp;·&nbsp; `Fastify` &nbsp;·&nbsp; `PostgreSQL` &nbsp;·&nbsp; `Redis` &nbsp;·&nbsp; `Cloudflare R2`

<br/>

[![License](https://img.shields.io/badge/License-Source--Available-blue?style=flat-square)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square)](https://github.com/the-developer-network/tdn-api/pulls)
[![Swagger Docs](https://img.shields.io/badge/API_Docs-Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black)](https://api.developernetwork.net/api/v1/docs)

<br/>

</div>

---

## Overview

TDN-API is the core RESTful backend service powering [developernetwork.net](https://developernetwork.net). All content is managed through a unified `Post` model, differentiated by a `type` field:

| Type     | Description                               |
| :------- | :---------------------------------------- |
| `post`   | General knowledge sharing and discussions |
| `job`    | Software industry job listings            |
| `news`   | Industry news and announcements           |
| `update` | Package and library release notices       |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) `v25.8.1`
- [pnpm](https://pnpm.io/) `10.30.1`
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)

### Installation

```bash
git clone https://github.com/the-developer-network/tdn-api.git
cd tdn-api
pnpm install
cp .env.example .env
```

Fill in all required variables in the `.env` file.

### Running

```bash
pnpm dev        # Development
pnpm build      # Build
pnpm start      # Production
```

---

## Authentication

JWT-based **Access + Refresh Token** strategy.

| Token         | Lifetime | Usage                           |
| :------------ | :------: | :------------------------------ |
| Access Token  |  15 min  | `Authorization: Bearer <token>` |
| Refresh Token |  30 min  | Obtain a new access token       |

OAuth sign-in via **GitHub** and **Google** is supported.

---

## API Reference

All endpoints are prefixed with `/api/v1`.  
Full interactive documentation available at `GET /api/v1/docs`.

```http
# Auth
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/send-verification    [Auth]
POST   /api/v1/auth/verify-email         [Auth]
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/recover-account

# OAuth
GET    /api/v1/oauth/github
GET    /api/v1/oauth/google

# Posts
GET    /api/v1/posts                     # Feed (filterable by type)
POST   /api/v1/posts                     [Auth]
POST   /api/v1/posts/media               [Auth]
DELETE /api/v1/posts/:id                 [Auth]

# Users
GET    /api/v1/users/me                  [Auth]
DELETE /api/v1/users/me                  [Auth]
PATCH  /api/v1/users/me/password         [Auth]
PATCH  /api/v1/users/me/username         [Auth]
PATCH  /api/v1/users/me/email            [Auth]

# Profiles
GET    /api/v1/profiles/search
GET    /api/v1/profiles/:username
GET    /api/v1/profiles/:username/followers
GET    /api/v1/profiles/:username/following
PATCH  /api/v1/profiles/me               [Auth]
PATCH  /api/v1/profiles/me/avatar        [Auth]
PATCH  /api/v1/profiles/me/banner        [Auth]

# Follow
POST   /api/v1/follow                    [Auth]
DELETE /api/v1/follow                    [Auth]

# Notifications
GET    /api/v1/notifications             [Auth]
PATCH  /api/v1/notifications/read-all    [Auth]

# Realtime
GET    /api/v1/realtime/ws               # WebSocket
```

---

## Contributing

Open an issue before submitting significant changes.

```bash
git checkout -b feature/your-feature
git commit -m "feat: describe your change"
git push origin feature/your-feature
```

---

## Contact

<div align="center">

[![Email](https://img.shields.io/badge/contact@developernetwork.net-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:contact@developernetwork.net)
&nbsp;
[![Admin](https://img.shields.io/badge/admin@developernetwork.net-EA4335?style=flat-square&logo=gmail&logoColor=white)](mailto:admin@developernetwork.net)

</div>

---

## License

This repository is **source-available**. You are welcome to read, learn, and contribute.  
Commercial use or redistribution without explicit written permission is **not permitted**.

See the [LICENSE](./LICENSE) file for full terms.

---

<div align="center">

© 2026 The Developer Network. All rights reserved.

</div>
