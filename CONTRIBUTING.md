# Contributing Guidelines

Thank you for considering contributing to Expense Tracker.

These guidelines help keep contributions consistent, reviewable, and secure.

## Development Setup

1. Fork the repository if you are contributing from an external account.
2. Clone your fork or the authorized repository.
3. Install backend dependencies with `cd backend && npm install`.
4. Install frontend dependencies with `cd frontend && npm install`.
5. Configure local environment variables as described in [README.md](README.md).
6. Run the backend and frontend locally.

Never commit database credentials, JWT secrets, access tokens, or other sensitive environment variables.

## Branching Strategy

Create a dedicated branch for each feature, bug fix, or documentation change.

Recommended branch prefixes:

- `feature/` — new functionality
- `fix/` — bug fixes
- `docs/` — documentation changes
- `test/` — test improvements
- `refactor/` — code restructuring

Examples:

```text
feature/expense-filter
fix/auth-validation
docs/readme-contributing
test/admin-authorization
```

Keep changes focused on the task described by the branch.

## Commit Messages

Use Conventional Commit-style messages where practical:

```text
feat: add expense filtering
fix: handle expired authentication tokens
docs: update setup instructions
test: cover admin authorization
refactor: simplify expense validation
```

Use a concise, descriptive subject line. Avoid combining unrelated changes into a single commit.

## Coding Guidelines

- Follow the existing project structure and conventions.
- Prefer clear, descriptive names for functions and variables.
- Validate user input on the server, even when frontend validation exists.
- Keep authentication and authorization checks on the backend.
- Preserve expense ownership checks for regular users.
- Do not allow public registration to assign privileged roles.
- Handle errors without exposing credentials, secrets, or sensitive internal details.
- Avoid unrelated changes and unnecessary dependencies.
- Add or update tests when behavior changes.

## Testing Requirements

Before opening a pull request, run the relevant checks.

### Backend

```bash
cd backend
npm test
```

### Frontend

```bash
cd frontend
npm test
npm run lint
npm run build
```

Review the output and fix failures introduced by your changes. If a test requires a live external service and cannot be run, document that limitation honestly.

## Pull Request Process

1. Update your branch with the latest target branch when appropriate.
2. Run tests, linting, and the production build.
3. Review the changes for unrelated files, secrets, and generated artifacts.
4. Commit your work with a descriptive message.
5. Push your feature branch.
6. Open a pull request targeting `main`.
7. Explain the problem, summarize the solution, and describe how it was tested.
8. Address review feedback and wait for required checks before merging.

A pull request should remain focused and small enough to review effectively.

## Security Issues

Do not publish credentials, private user data, or exploitable security details in public issues. Report security concerns privately to the repository maintainer.

## Documentation Changes

Keep setup instructions, environment-variable names, project structure, and test commands aligned with the actual codebase. Clearly distinguish mocked tests from tests that use live infrastructure.

Thank you for helping improve Expense Tracker!
