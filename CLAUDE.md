# Project Coding Standards

## Core Principles

- **Readability and maintainability are the PRIMARY CONCERNS**, even at the cost of conciseness. Prefer clean, easy-to-read solutions over clever or complex ones.

- Follow SOLID, KISS, and DRY principles. Keep code modular and production-grade. Long-term solutions only—no bandaid fixes or shortcuts.

## Code Style

- MATCH the style and formatting of surrounding code. Consistency within a file trumps external standards.
- NEVER change whitespace unrelated to code you're modifying.
- NEVER use temporal naming conventions like 'improved', 'new', or 'enhanced'. All naming should be evergreen.
- Use safe types. Avoid `any` and other shortcuts at all costs. These are not things you should "come back to later". Take care of them since the beginning.

## Scope Control

- NEVER make code changes completely unrelated to your current task. Document unrelated issues instead of fixing them.
- NEVER throw away implementations to rewrite them without EXPLICIT permission. Stop and ask first.

### Commits

- NEVER commit with a Co-Author line in the commit message.
- Keep the commit message details concise and easily readable (use bullet points).

## Comments and Documentation

- NEVER remove inline code comments unless you can PROVE they are actively false.
- NEVER refer to temporal context in comments (like "recently refactored"). Comments should be evergreen.
- Do NOT generate report/guide md files unless specifically asked.
- New core files SHOULD start with a 2-line comment prefixed with "ABOUTME: " explaining what the file does (optional for non-core files).

## Error Fixing Process

When fixing errors, find and fix the ROOT CAUSE-not symptoms:
1. Thoroughly and deeply explore the repo to identify where the error stems from, even if you have to re read certain files
2. Create a step-by-step plan
3. Debate with yourself whether this is the right direction. Re analyse your plan.
4. Recheck files to verify the plan makes sense; iterate and debate until you have the best solution plan
5. Only then implement and apply the fix
6. Once you have applied the fix, the MOST important part is to verify OBJECTIVELY and CRITICALLY if your applied fix was correct, targeted, didn't create any other unintended problems, and error free. Follow the steps in Verification section given below for this. If the errors persist or new ones pop up, note them down and restart from step one.

## Verification

After applying any and all changes:
0. Check the respective directory's package.json or whatever file is used for python backends to understand what commands are available.
1. Run type checks (`bun` or `python` or other tech stack as relevant) and lint and build commands
2. For Python: activate `.venv` via `source .venv/bin/activate`. 
3. Iteratively fix until all errors are resolved

## Persisted Store Defaults

Zustand stores using `persist` middleware (e.g. `teleprompterStore.ts`) save state to disk. When changing a persisted default value, you **must**:
1. Bump the store `version` number
2. Update the `migrate` function with a `version < N` guard that resets the old value to the new default
3. Add the previous default to the stale-defaults list so it gets migrated

Changing the default in the initializer alone has **no effect** on existing installations — the persisted value always overrides it.

## Context7

- Proactively use Context7 plugin and/or MCP tools to resolve latest and compatible library versions and fetch documentation for code generation, setup, configuration, or API usage—without being asked.

## Final Check

**Before submitting any work, verify you have followed ALL guidelines above. If you are considering an exception to ANY rule, STOP and get explicit permission first.**
