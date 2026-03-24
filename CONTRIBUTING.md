# Contributing to TDN-API

Thank you for your interest in contributing. Please take a moment to read these guidelines before submitting anything.

---

## Getting Started

1. Fork the repository
2. Clone your fork and create a new branch
3. Make your changes
4. Open a pull request

If your change is significant, **open an issue first** so we can discuss the approach before you invest time building it.

---

## Branch Naming

| Type          | Pattern                     | Example                     |
| :------------ | :-------------------------- | :-------------------------- |
| New feature   | `feature/short-description` | `feature/post-likes`        |
| Bug fix       | `fix/short-description`     | `fix/refresh-token-expiry`  |
| Maintenance   | `chore/short-description`   | `chore/update-dependencies` |
| Documentation | `docs/short-description`    | `docs/api-reference`        |

---

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

```
feat: add like endpoint
fix: resolve refresh token cookie not being cleared
chore: update fastify to v5
docs: update contributing guide
refactor: simplify post creation logic
test: add auth integration tests
```

Keep commits focused and atomic — one logical change per commit.

---

## Pull Requests

- Keep PRs small and focused
- Describe **what** changed and **why**
- Reference any related issue: `Closes #42`
- Make sure existing functionality is not broken before submitting

---

## Code Style

- Follow the existing code structure and patterns
- The project uses **Clean Architecture** — keep concerns separated
- No commented-out code in PRs

---

## Reporting Bugs

Open a [GitHub Issue](https://github.com/the-developer-network/tdn-api/issues) and include:

- What you expected to happen
- What actually happened
- Steps to reproduce

For security vulnerabilities, see [SECURITY.md](./SECURITY.md).

---

## Questions

Reach us at [contact@developernetwork.net](mailto:contact@developernetwork.net)
