# Contributing to Steadi

Thank you for your interest in contributing to Steadi! This document covers how to get started.

## Reporting Issues

- **Bug reports**: [open an issue](https://github.com/Siddharth-Khattar/Steadi/issues/new?template=bug_report.yml) with your OS, Steadi version, steps to reproduce, and expected vs actual behaviour.
- **Feature requests**: [open an issue](https://github.com/Siddharth-Khattar/Steadi/issues/new?template=feature_request.yml) describing the problem you're trying to solve and your proposed solution.
- **Security vulnerabilities**: see [SECURITY.md](SECURITY.md) for responsible disclosure.

## Development Setup

### Prerequisites

- **Node.js** (LTS) and **npm**
- **Rust** (stable) via [rustup](https://rustup.rs/)
- **Tauri v2 prerequisites**: see the [official guide](https://v2.tauri.app/start/prerequisites/)

### Getting Started

```sh
git clone https://github.com/Siddharth-Khattar/Steadi.git
cd Steadi
npm install
npm run tauri dev
```

For more details on the development workflow, CI pipeline, and release process, see the [Developer Guide](DOCS/GUIDE.md).

## Pull Requests

1. **Fork and branch**: create a feature branch from `main` (e.g., `feat/voice-sync`, `fix/overlay-flicker`).
2. **Keep changes focused**: one concern per PR. If you find an unrelated issue, file it separately.
3. **Run all checks before pushing**:
   ```sh
   npm run check:all
   ```
   This mirrors the CI pipeline and runs TypeScript type checking, ESLint, Rust Clippy (zero-warnings policy), and Rust formatting checks.
4. **Write clear commit messages**: describe _what_ changed and _why_. Keep the summary under 72 characters.
5. **Open the PR**: fill out the PR template, link any related issues, and include screenshots for UI changes.

## Code Style

- **Match surrounding code**: consistency within a file takes priority over external conventions.
- **Use safe types**: avoid `any` in TypeScript and `unsafe` in Rust unless absolutely necessary.
- **Keep comments evergreen**: no temporal references like "recently added" or "new implementation."
- **Preserve existing comments**: do not remove inline comments unless they are provably incorrect.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
