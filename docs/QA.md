# Quality Assurance & Testing Strategy

## Comprehensive Testing Strategy & Prioritized Roadmap

**TL;DR:** All 4 phases **complete**. Unit: 597 tests, 80 files. Integration: 60 tests, 9 files. E2E: ~220 tests, 47 files (rate-limit included). Full test suite passes across all layers. Unit coverage: **92.49% Stmts / 92.77% Branch / 91.79% Funcs** — use-case layer at 100%.

---

## Current State Analysis

| Category          | Status          | Details                                                                                       |
| ----------------- | --------------- | --------------------------------------------------------------------------------------------- |
| Unit Tests        | ✅ **Complete** | 597 tests, 80 files — all domain entities, use-cases, mappers, security & realtime services   |
| Integration Tests | ✅ **Complete** | 60 tests, 9 files — all repository layers against real DB                                     |
| E2E Tests         | ✅ **Complete** | ~220 tests, 47 files — all domains + rate-limit policy tests                                  |
| Test Infra        | ✅ Ready        | Vitest config, setup, scripts, bot seed in global-setup available; `mock-factories.ts` in use |
| Coverage          | ✅ **92%+**     | Unit: 92.49% Stmts / 92.77% Branch / 91.79% Funcs / 92.45% Lines — use-case layer at 100%     |

---

## Test Pyramid Target

```
        /   E2E   \        ← Target: domain-organized (auth/, user/, post/, etc.)
       / Integration\      ← Target: ~40-50 cases (repo, mapper, external)
      /     Unit      \    ← Target: ~120-150 cases (entity, use-case, service)
```

---

## Phase 1: Domain Entity Unit Tests (HIGHEST ROI — START NEXT)

**Why first?** Zero external dependencies, fastest execution, most stable, guarantees domain invariants.

**Target Files:**

### 1.1 User Entity (`src/core/domain/entities/user.entity.ts`)

- Constructor correctly sets all props
- `isDeleted()` — deletedAt null vs non-null
- `isEmailVerified()` — emailVerifiedAt check
- `isBot()` — isBot flag validation
- Bot restriction: can only create SYSTEM_UPDATE/TECH_NEWS post types (if enforced at entity level)
- All getters return correct prop values

### 1.2 Post Entity (`src/core/domain/entities/post.entity.ts`)

- Creation with 4 PostTypes (Community, TechNews, SystemUpdate, JobPosting)
- Creation with 5 PostCategories
- mediaUrls array handling
- tags array handling
- likesCount, commentsCount default values
- All getters work correctly

### 1.3 Comment Entity (`src/core/domain/entities/comment.entity.ts`)

- Top-level comment (parentId = null)
- Nested reply (parentId set)
- likesCount, repliesCount tracking
- Embedded author details validation

### 1.4 Notification Entity (`src/core/domain/entities/notification.entity.ts`)

- Creation with 5 NotificationTypes
- Recipient-issuer model
- isRead state
- Optional reference fields (postId, commentId)

### 1.5 Token Entities

- **RefreshToken** (`src/core/domain/entities/refresh-token.entity.ts`): hash, device info, revoked state, expiry
- **VerificationToken** (`src/core/domain/entities/verification-token.entity.ts`): type, expiry, hash

### 1.6 Profile Entity (`src/core/domain/entities/profile.entity.ts`)

- Optional fields (bio, location, socials)
- Avatar/banner URL handling
- followersCount, followingCount

### 1.7 Bookmark Entity (`src/core/domain/entities/bookmark.entity.ts`)

- Post bookmark vs Comment bookmark (if applicable)

### 1.8 Enum Tests (`src/core/domain/enums/`)

- PostType enum values
- PostCategory enum values
- NotificationType enum values
- TokenType enum values

**Estimated Case Count:** ~35-45
**File Location:** `tests/unit/core/domain/entities/`

---

## Phase 2: Use-Case Unit Tests (MOST CRITICAL BUSINESS LOGIC)

**Why second?** All business rules live here. Tested with mocked ports (zero DB dependency).

**Strategy:** Mock each port interface using Vitest `vi.fn()`. Cover happy path + error path.

### 2.1 Auth Domain (12 use-cases — HIGHEST PRIORITY)

| Use-Case                       | Test Scenarios                                                                                                                                                                                | Priority |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `LoginUseCase`                 | Valid credentials → returns token; Wrong password → InvalidCredentials; User not found → InvalidCredentials; Soft-deleted user → AccountPendingDeletion (with recoveryToken); Enum prevention | P0       |
| `RegisterUseCase`              | Successful registration; Duplicate email → UserAlreadyExists; Duplicate username → UserAlreadyExists; Password hashing call verification                                                      | P0       |
| `RefreshTokenUseCase`          | Valid token → new token pair; Revoked token → revoke all sessions (compromise detection); Expired token → Unauthorized; Deleted user → Unauthorized; Token not found → Unauthorized           | P0       |
| `LogoutUseCase`                | Token is revoked; No error thrown if token not found                                                                                                                                          | P0       |
| `VerifyEmailUseCase`           | Valid OTP → emailVerifiedAt set; Wrong OTP → BadRequest; Expired OTP → BadRequest                                                                                                             | P1       |
| `SendVerificationEmailUseCase` | Already verified → BadRequest; OTP generation + email sending                                                                                                                                 | P1       |
| `ForgotPasswordUseCase`        | Registered email → OTP sent; Unknown email → returns silently (enumeration prevention)                                                                                                        | P1       |
| `ResetPasswordUseCase`         | Valid OTP + new password → updated; Wrong OTP → error; Unverified email → error                                                                                                               | P1       |
| `RecoverAccountUseCase`        | Valid recovery token → deletedAt set to null; Invalid token → Unauthorized                                                                                                                    | P1       |
| `CheckUserUseCase`             | Existing user → exists: true; Unknown → exists: false                                                                                                                                         | P2       |
| `PurgeExpiredTokensUseCase`    | deleteExpiredTokens is called                                                                                                                                                                 | P2       |

### 2.2 User Domain (7 use-cases) ✅ Complete — 37 tests

| Use-Case                   | Test Scenarios                                                                  | Priority | Status     |
| -------------------------- | ------------------------------------------------------------------------------- | -------- | ---------- |
| `SoftDeleteUserUseCase`    | Correct password → soft delete; Wrong password → error; Already deleted → error | P0       | ✅ 7 tests |
| `GetMeUseCase`             | User found → returned; Not found → NotFound                                     | P1       | ✅ 7 tests |
| `ChangePasswordUseCase`    | Old password correct, new password hashed; Old password wrong → error           | P1       | ✅ 6 tests |
| `ChangeUsernameUseCase`    | Available username → updated; same-value guard; not found guard                 | P1       | ✅ 5 tests |
| `ChangeEmailUseCase`       | New email → updated; same-value guard; not found guard                          | P1       | ✅ 5 tests |
| `CreateUserUseCase`        | User + profile created                                                          | P1       | ✅ 3 tests |
| `PurgeExpiredUsersUseCase` | Purge job executes                                                              | P2       | ✅ 4 tests |

> **Source fixes applied:** `ChangeEmailUseCase` and `ChangeUsernameUseCase` — added `findById` guard (`NotFoundError`) and same-value `BadRequestError`. `SoftDeleteUserUseCase` — added `deletedAt !== null` guard to prevent double soft-delete. `GetMeUserUseCase` — removed `UserPrismaMapper` import (Clean Architecture violation), now maps inline from entity getters. `GetMeUserUseCaseOutput` — added missing `id` and `isBot` fields.

### 2.3 Post Domain (9 use-cases)

| Use-Case                 | Test Scenarios                                                                                                                                                          | Priority |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `CreatePostUseCase`      | Normal user + Community type → created; Bot → SYSTEM_UPDATE/TECH_NEWS OK; Normal user + SYSTEM_UPDATE → Forbidden; Cache invalidation called; Tag extraction (#hashtag) | P0       |
| `LikePostUseCase`        | Successful like → transaction (like + increment); Already liked → silent; Cache invalidation                                                                            | P1       |
| `UnlikePostUseCase`      | Successful unlike → transaction (unlike + decrement); Already unliked → silent                                                                                          | P1       |
| `DeletePostUseCase`      | Owner → deletion successful; Another user's post → Forbidden; Cache invalidation                                                                                        | P1       |
| `GetPostsUseCase`        | Pagination; Filtering (type, tag, categories, following, saved); Empty result                                                                                           | P1       |
| `GetPostDetailUseCase`   | Existing post → returned; Non-existent post → NotFound; Optional auth (isLiked, isBookmarked)                                                                           | P1       |
| `GetUserPostsUseCase`    | Filter by username; Pagination                                                                                                                                          | P2       |
| `GetTrendsUseCase`       | 7-day trending tags                                                                                                                                                     | P2       |
| `UploadPostMediaUseCase` | File upload → URL returned; 4 file limit; Type validation                                                                                                               | P1       |

### 2.4 Comment Domain (7 use-cases)

| Use-Case                   | Test Scenarios                                                                                                                                       | Priority |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `CreateCommentUseCase`     | Top-level comment creation + commentsCount increment; Reply (parentId) + repliesCount increment; Transaction verification; Post not found → NotFound | P1       |
| `DeleteCommentUseCase`     | Owner → delete + count decrement; Other user → Forbidden; Transaction                                                                                | P1       |
| `LikeCommentUseCase`       | Like + count increment; Already liked → silent                                                                                                       | P1       |
| `UnlikeCommentUseCase`     | Unlike + count decrement; Already unliked → silent                                                                                                   | P1       |
| `GetPostCommentsUseCase`   | Top-level only; Pagination; Optional auth                                                                                                            | P2       |
| `GetCommentUseCase`        | Existing → returned; NotFound                                                                                                                        | P2       |
| `GetCommentRepliesUseCase` | Replies pagination                                                                                                                                   | P2       |

### 2.5 Follow Domain (4 use-cases)

| Use-Case              | Test Scenarios                                                                                             | Priority |
| --------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| `FollowUserUseCase`   | Successful follow + notification creation + realtime emit; Self-follow → error; Already following → silent | P1       |
| `UnfollowUserUseCase` | Successful unfollow; Not following → silent                                                                | P1       |
| `GetFollowersUseCase` | Pagination; Empty list                                                                                     | P2       |
| `GetFollowingUseCase` | Pagination; Empty list                                                                                     | P2       |

### 2.6 Bookmark Domain (5 use-cases)

| Use-Case                       | Test Scenarios                             | Priority |
| ------------------------------ | ------------------------------------------ | -------- |
| `CreateBookmarkUseCase`        | Post bookmark; Already bookmarked → silent | P1       |
| `DeleteBookmarkUseCase`        | Bookmark removal                           | P1       |
| `CreateCommentBookmarkUseCase` | Comment bookmark                           | P2       |
| `DeleteCommentBookmarkUseCase` | Comment bookmark removal                   | P2       |
| `GetBookmarksUseCase`          | Pagination, mixed post+comment             | P2       |

### 2.7 Other Domains

| Use-Case                   | Test Scenarios                                                                                                                          | Priority | Status                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------- |
| OAuth (3 use-cases)        | Provider exchange; Replay attack prevention; Expired code; New user creation vs existing user login; Soft-deleted OAuth user → recovery | P1       | ❌ Pending                 |
| Profile (6 use-cases)      | Get profile; Update profile; Avatar/banner upload; Search; Suggested users                                                              | P2       | ✅ **Complete — 49 tests** |
| Notification (3 use-cases) | Get notifications + pagination; Mark all read; Purge expired                                                                            | P2       | ❌ Pending                 |
| Tag (1 use-case)           | Search tags                                                                                                                             | P2       | ❌ Pending                 |
| Translation (1 use-case)   | Successful translation; API error → TranslationFailedError                                                                              | P2       | ❌ Pending                 |

> **Profile source fixes applied:** `UpdateBannerUseCase` — `DEFAULT_BANNER_KEY` typo fixed (`.jpe` → `.jpeg`); `this.logger.error` → `this.logger?.error` (aligned with `UpdateAvatarUseCase`).

**Estimated Case Count:** ~80-100
**File Location:** `tests/unit/core/use-cases/<domain>/`

---

## Phase 3: Infrastructure Integration Tests

**Why third?** Validates mapper correctness and repository queries against a real database.

### 3.1 Mapper Unit Tests (Zero DB Dependency — Actually Unit Tests)

**File Location:** `tests/unit/infrastructure/mappers/`

| Mapper                          | Test Scenarios                                                                                                  | Priority |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------- |
| `UserPrismaMapper`              | toDomainUser (all fields); toResponse (passwordHash stripped, deletedAt stripped); toPrismaCreateUser           | P1       |
| `PostPrismaMapper`              | toDomainPost (with relations); toResponse (CDN URL normalization); toFeedResponse (array mapping); toPrismaPost | P1       |
| `CommentPrismaMapper`           | toDomainComment; toResponse (nested author, likes, bookmarks); toListResponse                                   | P1       |
| `ProfilePrismaMapper`           | toDomain (\_count handling); toResponse; toPrismaUpdate (partial fields)                                        | P1       |
| `NotificationPrismaMapper`      | toResponse; toGetNotificationOutput (CDN URL); toPrisma                                                         | P2       |
| `AuthPrismaMapper`              | toUserOutput; toTokenOutput; toAuthOutput                                                                       | P2       |
| `TagPrismaMapper`               | mapPostTypeToCategory                                                                                           | P2       |
| `RefreshTokenPrismaMapper`      | toDomain                                                                                                        | P2       |
| `VerificationTokenPrismaMapper` | toDomain                                                                                                        | P2       |

**Estimated Case Count:** ~25-30

### 3.2 Security & Realtime Service Unit Tests

**File Location:** `tests/unit/infrastructure/security/` and `tests/unit/infrastructure/realtime/`

| Service                     | Test Scenarios                                                                                                                           | Priority |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `PasswordService` (Argon2i) | hash → verify = true; hash → wrong password = false; Different hashes are unique                                                         | P0       |
| `CryptoService`             | generateRandomHex → correct length; generateOtp → 8 digits; hashOtp → deterministic SHA256                                               | P1       |
| `AuthTokenService`          | generate → valid JWT; verify → correct payload; hashRefreshSecret → deterministic; generateRecoveryToken + verifyRecoveryToken roundtrip | P1       |
| `WebSocketManager`          | registerClient → stored in Map; getClient → returns socket; removeClient → removed from Map; overwrite existing client                   | P1       |
| `FastifyRealtimeService`    | emitToUser → Redis publish called with correct channel/payload; Redis subscriber routes to WebSocketManager; socket not found → no-op    | P1       |

> **Note on WebSocket testing strategy:**
>
> - **Use-case level (Phase 2):** `FollowUserUseCase`, `LikePostUseCase`, `CreateCommentUseCase`, `LikeCommentUseCase` unit tests will mock `RealtimePort` and assert `emitToUser()` is called — this validates the _trigger_ logic.
> - **Infrastructure level (here):** `WebSocketManager` and `FastifyRealtimeService` unit tests validate the _delivery_ mechanism using mocked Redis and WebSocket instances.
> - **E2E end-to-end delivery** (real WS client ↔ server): Kept as optional (Phase 4) — requires real HTTP port + `ws` package since `server.inject()` does not support WebSocket upgrades.

**Estimated Case Count:** ~18-22

### 3.3 Repository Integration Tests (Real DB Required)

**File Location:** `tests/integration/persistence/repositories/`
**Infrastructure:** Test DB with Prisma migrate + seed

| Repository                     | Test Scenarios                                                                                                                           | Priority |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `PrismaUserRepository`         | create → findById; createWithOAuth; findByIdentifier (email/username); Duplicate → P2002 → UserAlreadyExistsError; Soft delete filtering | P1       |
| `PrismaPostRepository`         | create with hashtag extraction; findAll pagination; Filtering (type, tag, categories, following, saved); Cursor-based pagination         | P1       |
| `PrismaCommentRepository`      | create comment; findTopLevelByPostId; findRepliesByParentId; incrementRepliesCount                                                       | P2       |
| `PrismaRefreshTokenRepository` | create → findByTokenHash; update revocation; deleteExpiredTokens; revokeAllByUserId                                                      | P1       |
| `PrismaFollowRepository`       | followUser/unfollowUser; checkIsFollowing; checkIsFollowingBulk; getFollowersCount                                                       | P2       |
| `PrismaNotificationRepository` | create (100 cap); findAllByUserId; getUnreadCount; markAllAsRead; deleteExpiredNotifications                                             | P2       |
| `PrismaProfileRepository`      | findByUsername; update; search (case-insensitive); getSuggestedUsers                                                                     | P2       |
| `PrismaBookmarkRepository`     | save/remove/isBookmarked                                                                                                                 | P2       |
| `PrismaLikeRepository`         | like/unlike/isLiked; increment/decrementLikeCount                                                                                        | P2       |
| `PrismaTagRepository`          | findTrending (7-day window); search                                                                                                      | P2       |

**Estimated Case Count:** ~40-50

---

## Phase 4: HTTP Layer & Cross-Cutting Concern Tests

**Why last?** E2E tests already partially cover this layer. Focus on closing missing edge cases.

### 4.1 Error Handler Plugin Tests

> **Scope decision:** Unit tests for error-handler were not added. Every E2E test scenario that hits a 4xx/5xx path exercises the error handler (RFC 7807 format, statusCode mapping, `...error` spread) — coverage via E2E flows is sufficient. Adding a separate unit test with an isolated `Fastify({ logger: false })` instance would be a mini-integration test, not a true unit test, and provides low incremental value.

**Status:** ✅ Covered via E2E flows.

### 4.2 Rate Limit Policy Tests (E2E)

| Test Scenarios                                        | Priority |
| ----------------------------------------------------- | -------- |
| STRICT: 4th request → 429; continueExceeding behavior | P2       |
| SENSITIVE: 6th request → 429                          | P2       |
| Bot token allowlist → rate limit bypass               | P2       |

### 4.3 E2E Test Additions

| Area        | Missing Scenarios                 | Priority |
| ----------- | --------------------------------- | -------- |
| All domains | ✅ All covered — no open E2E gaps | —        |

> **WebSocket E2E:** Kapsam dışı bırakıldı. `WebSocketManager` ve `FastifyRealtimeService` unit testleri (Phase 3.2) delivery mekanizmasını yeterince kapsamaktadır. Gerçek WS E2E için `server.listen()` + `ws` paketi + Redis gerektiren ayrı config zinciri kurulumu düşük ROI nedeniyle bu döngüde planlanmamıştır.

**Estimated Case Count:** ~15-20

---

## Prioritized Implementation Roadmap

### Sprint 1: Foundation (Phase 1 + Phase 2 P0s)

**Can be parallelized, independent work streams**

1. Entity unit tests (Phase 1 complete) — ~35-45 cases
2. Auth use-case P0 tests (Login, Register, Refresh, Logout) — ~20 cases
3. Security service tests (Password, Crypto) — ~12 cases
4. ✅ User use-case P0 tests (SoftDelete) — 7 tests (**done**)
5. Post use-case P0 tests (CreatePost bot restriction) — ~8 cases

**Total: ~80-90 cases → Expected coverage increase: 15-25%**

### Sprint 2: Business Logic Depth (Phase 2 P1s)

**Depends on Sprint 1 (mock patterns will be established)**

6. Remaining Auth use-case P1s (Verify, Forgot, Reset, Recover) — ~20 cases
7. Post domain P1s (Like, Unlike, Delete, GetPosts, Upload) — ~20 cases
8. Comment domain P1s (Create, Delete, Like, Unlike) — ~15 cases
9. Follow domain P1s (Follow, Unfollow + notification) — ~8 cases
10. Bookmark domain P1s — ~6 cases
11. OAuth domain P1s — ~10 cases
12. Mapper unit tests (Phase 3.1 P1s) — ~15 cases
13. WebSocketManager + FastifyRealtimeService unit tests (Phase 3.2) — ~8 cases
14. ✅ Remaining User use-case P1s (GetMe, ChangePassword, ChangeUsername, ChangeEmail, CreateUser, Purge) — 30 tests (**done**)
15. ✅ Profile use-case P2s (GetProfile, UpdateProfile, Search, Suggestions, UpdateAvatar, UpdateBanner) — 49 tests (**done**)

**Total: ~102 cases → Expected coverage increase: 40-55%**

### Sprint 3: Integration & Deepening (Phase 3 remaining + Phase 2 P2s)

**Depends on Sprint 2 (use-case mocks serve as reference)**

13. Repository integration test infrastructure (test DB setup)
14. P1 repository integration tests — ~25 cases
15. Phase 2 P2 use-case tests (Notification, Tag, Translation) — ~12 cases
16. Remaining mapper tests — ~10 cases

**Total: ~55 cases → Expected coverage increase: 60-70%**

### Sprint 4: Coverage Completion (Phase 4 + remaining P2s) ✅ Done

- ~~Error handler plugin tests~~ — covered via E2E flows (scope decision)
- E2E rate limit tests — 6 tests ✅ (`tests/e2e/rate-limit/rate-limit.test.ts`)
- Repository integration tests — 60 tests ✅ (`tests/integration/`)
- `DISABLE_RATE_LIMIT` env var refactor — replaces `NODE_ENV === "test"` bypass ✅

**Total: ~66 cases → Final Coverage: 92.49% Stmts / 92.77% Branch / 91.79% Funcs / 92.45% Lines**

**Coverage highlights:**

- All use-case layers (auth, user, post, comment, follow, bookmark, oauth, profile, notification, translate, tag): ✅ 100%
- Security services (Password, Crypto, AuthToken): ✅ 100%
- WebSocket manager: ✅ 100%
- Mappers: ~90%
- Domain entities: ~83% (`notification.entity.ts` partially tested — some getters out of scope)
- `redis.service.ts`: 0% (infrastructure impl excluded from coverage scope — tested via mocks in use-cases)

---

## Test Infrastructure Requirements

### Mock Factory Pattern

- ✅ `tests/unit/helpers/mock-factories.ts` — in use; exports `buildUser()`, `buildProfile()`, `buildVerificationToken()`, `buildRefreshToken()`, `buildComment()`, `buildNotification()`, `buildPost()`
- `tests/helpers/entity-builders.ts` — Builder pattern for creating test entities (pending)
- `tests/helpers/test-fixtures.ts` — Fixed test data (pending)

### Integration Test Infrastructure (to be created in Sprint 3)

- `tests/integration/setup.ts` — Test DB connection, migration, seed, cleanup
- Docker Compose or testcontainers with PostgreSQL + Redis

### E2E Test Structure

E2E tests are organized by domain. All domains are fully covered.

```
tests/e2e/
├── global-setup.ts             ← DB reset + bot user seed (argon2i + SHA256 botToken)
├── setup.ts                    ← Fastify app lifecycle + request/authRequest helpers
├── test-constants.ts           ← Shared test data (BOT_USER credentials)
├── auth/                       ← 8 files: login, register, check-user, email-verification,
│                                           password-reset, recover-account, logout, refresh
├── user/                       ← 6 files: get-me, change-password, change-username,
│                                           change-email, soft-delete, get-user-posts
├── post/                       ← 5 files: create (incl. bot restriction), delete,
│                                           get-feed (incl. category + followedOnly), get-post, upload-media
├── comment/                    ← 4 files: create, delete, get-comments, interact
├── follow-user/                ← 3 files: follow, unfollow, get-follows
├── like/                       ← 2 files: like, unlike
├── bookmark/                   ← 5 files: save-post, remove-post, save-comment, remove-comment, get-bookmarks
├── notification/               ← 2 files: get-notifications, mark-all-read
├── oauth/                      ← 2 files: exchange, redirect
├── profile/                    ← 6 files: get-profile, update-profile, search, suggestions,
│                                           upload-avatar, upload-banner
├── translate/                  ← 1 file: translate
└── trend/                      ← 2 files: get-trends, search-tags
```

> **Status:** ✅ E2E layer complete — 219 tests, 46 files, all passing.

### Full Directory Structure

```
tests/
├── unit/
│   ├── core/
│   │   ├── domain/entities/
│   │   └── use-cases/
│   │       ├── auth/
│   │       ├── user/
│   │       ├── post/
│   │       ├── comment/
│   │       ├── follow/
│   │       ├── bookmark/
│   │       ├── oauth/
│   │       ├── profile/
│   │       ├── notification/
│   │       ├── tag/
│   │       └── translate/
│   └── infrastructure/
│       ├── mappers/
│       └── security/
├── integration/
│   ├── setup.ts
│   └── persistence/repositories/
├── e2e/
│   ├── setup.ts
│   ├── auth/
│   │   ├── login.test.ts
│   │   └── register.test.ts
│   └── user/
│       └── get-me.test.ts
└── helpers/
    ├── mock-factories.ts
    ├── entity-builders.ts
    └── test-fixtures.ts
```

---

## Testing Matrix

### Layer × Test Type Matrix

| Layer                    | Unit                                            | Integration     | E2E                     |
| ------------------------ | ----------------------------------------------- | --------------- | ----------------------- |
| Domain Entities          | ✅ Phase 1                                      | —               | —                       |
| Domain Enums             | ✅ Phase 1                                      | —               | —                       |
| Use-Cases (Auth)         | ✅ Phase 2 P0                                   | —               | ✅ auth/login, register |
| Use-Cases (User)         | ✅ Phase 2 P0-P1                                | —               | ✅ user/get-me          |
| Use-Cases (Post)         | ✅ Phase 2 P0-P1                                | —               | Phase 4                 |
| Use-Cases (Comment)      | ✅ Phase 2 P1                                   | —               | Phase 4                 |
| Use-Cases (Follow)       | ✅ Phase 2 P1                                   | —               | Phase 4                 |
| Use-Cases (Bookmark)     | ✅ Phase 2 P1-P2                                | —               | Phase 4                 |
| Use-Cases (OAuth)        | ✅ Phase 2 P1                                   | —               | Phase 4                 |
| Use-Cases (Profile)      | ✅ Phase 2 P2                                   | —               | Phase 4                 |
| Use-Cases (Notification) | ✅ Phase 2 P2                                   | —               | Phase 4                 |
| Mappers                  | ✅ Phase 3.1                                    | —               | —                       |
| Security Services        | ✅ Phase 3.2                                    | —               | —                       |
| Repositories             | —                                               | ✅ Phase 3.3    | —                       |
| Error Handler            | ✅ via E2E flows                                | —               | ✅ via E2E flows        |
| Rate Limiting            | —                                               | —               | ✅ Phase 4.2            |
| Plugins (JWT, Cookie)    | —                                               | —               | ✅ via auth E2E         |
| WebSocket/Realtime       | ✅ Phase 3.2 (WsManager + RealtimeService unit) | —               | ❌ Out of scope         |
| Scheduled Jobs           | —                                               | ✅ Phase 3      | —                       |
| External Services        | —                                               | Mock ✅ Phase 2 | —                       |

### Risk × Coverage Matrix

| Module                        | Business Risk | Current Coverage | Target | Sprint         |
| ----------------------------- | ------------- | ---------------- | ------ | -------------- |
| Auth (Login/Register/Refresh) | 🔴 Critical   | ~0%              | 90%+   | 1              |
| Token Compromise Detection    | 🔴 Critical   | ~0%              | 95%+   | 1              |
| Soft Delete & Recovery        | 🔴 Critical   | ~80%             | 90%+   | ✅ Done        |
| Post CRUD + Bot Restriction   | 🟠 High       | ~0%              | 85%+   | 1-2            |
| Comment CRUD + Transactions   | 🟠 High       | ~0%              | 85%+   | 2              |
| OAuth Flow                    | 🟠 High       | ~0%              | 80%+   | 2              |
| Follow + Notification         | 🟡 Medium     | ~0%              | 75%+   | 2              |
| Bookmark                      | 🟡 Medium     | ~0%              | 75%+   | 2              |
| Mappers (Data Integrity)      | 🟡 Medium     | 0%               | 85%+   | 2-3            |
| Profile CRUD                  | 🟢 Low        | ~70%             | 70%+   | ✅ Done        |
| Tags/Translation              | 🟢 Low        | 0%               | 70%+   | 4              |
| Realtime/WebSocket            | 🟡 Medium     | ✅ ~60%          | 60%+   | ✅ Done (unit) |

---

## Verification

1. **After each sprint:** Run `pnpm test:coverage` → verify coverage targets are met
2. **Unit tests:** `pnpm test:unit` — target <5 seconds
3. **Integration tests:** `pnpm test:integration` — target <30 seconds
4. **E2E tests:** `pnpm test:e2e` — target <60 seconds (compatible with 30s timeout config)
5. **CI pipeline:** Unit → Integration → E2E in order, fail-fast
6. **Mutation testing (optional):** After Sprint 3, use `@stryker-mutator/vitest-runner` for business logic quality validation

---

## Decisions & Out of Scope

**In Scope:**

- All domain entity, use-case, mapper, and security service unit tests
- Repository integration tests (real DB)
- E2E tests rebuilt with clean domain-organized structure

**Out of Scope (not planned for this cycle):**

- Performance / load tests
- Contract tests (API schema compatibility)
- WebSocket E2E tests (delivery mechanism covered by Phase 3.2 unit tests; real WS client testing requires `server.listen()` + `ws` package + Redis — low ROI)
- WebSocket stress tests
- Visual regression / UI tests (backend-only project)
- Chaos engineering / failure injection

---

## Completed Security Fixes

| Fix                                                                                                             | File                                        | Branch                                    |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------- |
| WebSocket auth migrated from `?token=` query param to first-message `{ event: "auth", token }` with 10s timeout | `src/http/routes/realtime.routes.ts`        | `refactor/ws-auth-first-message` (merged) |
| `GetMeUserUseCase` removed `UserPrismaMapper` import (Clean Architecture violation)                             | `src/core/use-cases/user/get-me/`           | `chore/unit-tests-use-cases`              |
| `ChangeEmailUseCase` / `ChangeUsernameUseCase` — added not-found guard + same-value guard                       | `src/core/use-cases/user/change-*/`         | `chore/unit-tests-use-cases`              |
| `SoftDeleteUserUseCase` — added `deletedAt !== null` guard (idempotency bug)                                    | `src/core/use-cases/user/soft-delete/`      | `chore/unit-tests-use-cases`              |
| `UpdateBannerUseCase` — `DEFAULT_BANNER_KEY` typo (`.jpe` → `.jpeg`) + `logger?.error` optional chain           | `src/core/use-cases/profile/update-banner/` | `chore/unit-tests-use-cases`              |

---

## Additional Notes

- **Mock pattern:** Port interfaces enable fully isolated use-case testing — the greatest advantage of Clean Architecture
- **Transaction tests:** Use-cases call TransactionPort.runInTransaction — validate inner operations by executing the callback in the mock
- **Silent operations:** Idempotent operations like Like/Unlike/Follow/Bookmark do not throw errors; this behavior must be tested
- **Cache invalidation:** Assert that deleteByPattern calls use the correct pattern
