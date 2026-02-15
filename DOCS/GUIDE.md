# Developer Guide

Steadi is a Tauri 2 desktop app (React + Rust). This guide covers local development, quality checks, CI, and the release process.

## Prerequisites

- **Node.js** (LTS) and npm
- **Rust** (stable) via [rustup](https://rustup.rs/)
- **Tauri v2 prerequisites** — see the [official guide](https://v2.tauri.app/start/prerequisites/) for your platform (Xcode CLT on macOS, Visual Studio Build Tools on Windows)

## Setup

```sh
git clone git@github.com:Siddharth-Khattar/Steadi.git
cd Steadi
npm install
```

## Local Development

Start the dev server and Tauri window with hot-reload:

```sh
npm run tauri dev
```

This launches both Vite (frontend) and the Rust backend. Changes to `src/` hot-reload instantly; changes to `src-tauri/src/` trigger a Rust recompile.

## Quality Checks

Run all checks before pushing — this is the same suite CI runs on every PR:

```sh
npm run check:all
```

This runs, in order:

| Command | What it does |
|---------|-------------|
| `npm run typecheck` | TypeScript type checking (`tsc -b`) |
| `npm run lint` | ESLint on `src/**/*.{ts,tsx}` |
| `npm run clippy` | Rust linting with `-D warnings` (zero warnings policy) |
| `npm run fmt:rust` | Rust formatting check |

### Individual commands

```sh
npm run typecheck       # TypeScript only
npm run lint            # ESLint only
npm run lint:fix        # ESLint with auto-fix
npm run clippy          # Rust clippy only
npm run fmt:rust        # Check Rust formatting
npm run fmt:rust:fix    # Apply Rust formatting
```

## CI Pipeline

Every PR to `main` triggers three jobs automatically:

1. **Frontend check** (Ubuntu) — typecheck + ESLint
2. **Rust check** (macOS) — clippy + rustfmt
3. **Build check** (macOS) — full `tauri build --no-sign` to verify the complete pipeline compiles

All three must pass before merging.

## Distribution

Steadi is distributed via two quarantine-free install methods for macOS (bypasses Gatekeeper for unsigned builds):

### Homebrew (recommended)

A personal tap at [`siddharth-khattar/steadi`](https://github.com/Siddharth-Khattar/homebrew-steadi) hosts the cask:

```sh
brew tap siddharth-khattar/steadi
brew install --cask steadi
```

The cask is updated automatically by CI when a stable release is published — no manual tap maintenance needed.

### Shell install script

For users without Homebrew:

```sh
curl -fsSL https://raw.githubusercontent.com/Siddharth-Khattar/Steadi/main/install.sh | sh
```

The script detects architecture, downloads the correct DMG from the latest release, installs to `/Applications`, and strips the quarantine attribute. To pin a specific version:

```sh
STEADI_VERSION=v0.2.0 sh install.sh
```

### Manual DMG download

If a user downloads the DMG directly from GitHub Releases, macOS will quarantine it. After dragging `Steadi.app` to `/Applications`, run:

```sh
xattr -cr /Applications/Steadi.app
```

## Creating a Release

Releases are triggered by pushing a `v*` tag. The workflow builds for macOS (Apple Silicon + Intel) and Windows, then creates a **draft** GitHub Release.

### Step by step

1. **Ensure `main` is up to date** with all changes merged and CI green.

2. **Update version numbers** in three files (they must match):

   - `package.json` → `"version": "x.y.z"`
   - `src-tauri/tauri.conf.json` → `"version": "x.y.z"`
   - `src-tauri/Cargo.toml` → `version = "x.y.z"`

3. **Commit the version bump:**

   ```sh
   git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
   git commit -m "release: vX.Y.Z"
   ```

4. **Tag and push:**

   ```sh
   git tag vX.Y.Z
   git push origin main --tags
   ```

5. **Wait for the release workflow** to complete on the [Actions tab](https://github.com/Siddharth-Khattar/Steadi/actions). It builds three targets:

   | Platform | Artifact |
   |----------|----------|
   | macOS (Apple Silicon) | `Steadi_*_aarch64.dmg` |
   | macOS (Intel) | `Steadi_*_x64.dmg` |
   | Windows | `Steadi_*_x64-setup.exe` |

   A `checksums-sha256.txt` file is generated and attached automatically.

6. **Review the draft release** on the [Releases page](https://github.com/Siddharth-Khattar/Steadi/releases). Edit the notes if needed, then click **Publish release**.

7. **Homebrew tap auto-updates.** When you publish a non-prerelease, the `update-homebrew` workflow downloads both macOS DMGs, computes SHA-256 hashes, renders `.github/cask-template.rb` with the new values, and pushes the updated cask to the [`homebrew-steadi`](https://github.com/Siddharth-Khattar/homebrew-steadi) repo. Pre-releases (RC/alpha/beta) are skipped automatically.

### Deleting a test release

If you pushed a release candidate tag for testing:

```sh
gh release delete vX.Y.Z-rc.1 --yes
git push origin :refs/tags/vX.Y.Z-rc.1
git tag -d vX.Y.Z-rc.1
```

## Code Signing

Builds are unsigned by default. To enable signing, add these GitHub repository secrets (no workflow changes needed):

**macOS:**
- `APPLE_CERTIFICATE` — Base64-encoded .p12 certificate
- `APPLE_CERTIFICATE_PASSWORD` — Certificate password
- `APPLE_SIGNING_IDENTITY` — e.g. `Developer ID Application: Your Name (TEAM_ID)`
- `APPLE_ID` — Apple ID email (for notarization)
- `APPLE_PASSWORD` — App-specific password (for notarization)
- `APPLE_TEAM_ID` — Apple Developer team ID

**Windows:**
- `TAURI_SIGNING_PRIVATE_KEY` — Private key for signing
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` — Key password

**Homebrew tap:**
- `HOMEBREW_TAP_TOKEN` — Fine-grained GitHub PAT scoped to `Siddharth-Khattar/homebrew-steadi` with `Contents: Read and write`. Used by the `update-homebrew` workflow to push cask updates.

## Project Structure

```
Steadi/
  src/                    # Frontend (React + TypeScript)
    main/                 # Main application window
    overlay/              # Overlay teleprompter window
    components/           # Shared UI components
    styles/               # Global CSS
  src-tauri/              # Rust backend
    src/
      lib.rs              # App entry point, plugin setup, shortcuts
      overlay.rs          # Overlay window creation and native styling
      commands.rs         # IPC command handlers
      main.rs             # Binary entry point
    tauri.conf.json       # Tauri configuration
    Cargo.toml            # Rust dependencies
  install.sh              # macOS install script (quarantine-free)
  .github/
    cask-template.rb      # Homebrew cask template (CI renders with sed)
    workflows/
      ci.yml              # PR validation pipeline
      release.yml         # Tag-triggered release pipeline
      update-homebrew.yml # Auto-update Homebrew tap on stable release
```
