# Contributing to Text0

Thanks for helping improve Text0.

## Setup

Requirements: Node.js and Bun.

```bash
bun install
bun dev
```

Copy `.env.example` to `.env.local` and fill in the required services described
in the README before starting the app.

## Formatting and linting

The repository uses Biome:

```bash
bun run lint          # check without writing
bun run biome:check   # format and fix safe issues
```

Run `bun run biome:check` before committing.

## Husky hooks

The repository uses Husky hooks:

- `pre-commit` runs `bun run biome:check`.
- `commit-msg` enforces conventional commit messages.

Merge commits are allowed; normal commits must match:

```text
type(scope): description
```

Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`chore`, `revert`.

Example:

```text
feat(auth): add login functionality
```

## Pull requests

- Keep PRs focused and explain what and why.
- Mention the issue number when one exists.
- Run `bun run biome:check` before pushing.
- Do not commit real secrets or environment values.
