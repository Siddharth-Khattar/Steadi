#!/bin/sh
# ABOUTME: Installer script for Steadi on macOS. Downloads the latest DMG from
# ABOUTME: GitHub Releases, installs to /Applications, and strips quarantine.

set -eu

REPO="Siddharth-Khattar/Steadi"
APP_NAME="Steadi"

# --- Detect architecture ---
case "$(uname -m)" in
  arm64)  ARCH="aarch64" ;;
  x86_64) ARCH="x64" ;;
  *)
    printf "Error: unsupported architecture %s\n" "$(uname -m)" >&2
    exit 1
    ;;
esac

# --- Resolve version ---
if [ -n "${STEADI_VERSION:-}" ]; then
  VERSION="$STEADI_VERSION"
  # Ensure the version has a 'v' prefix for the download URL
  case "$VERSION" in
    v*) ;;
    *)  VERSION="v${VERSION}" ;;
  esac
else
  LOCATION=$(curl -sI "https://github.com/${REPO}/releases/latest" \
    | grep -i '^location:' | tr -d '\r')
  VERSION=$(printf '%s' "$LOCATION" | sed 's|.*/tag/||')
  if [ -z "$VERSION" ]; then
    printf "Error: could not resolve latest version\n" >&2
    exit 1
  fi
fi

VERSION_NUM="${VERSION#v}"

printf "Installing %s %s (%s)...\n" "$APP_NAME" "$VERSION" "$ARCH"

# --- Set up temp dir with cleanup ---
WORK_DIR=$(mktemp -d)
MOUNT_POINT=""

cleanup() {
  if [ -n "$MOUNT_POINT" ]; then
    hdiutil detach "$MOUNT_POINT" -quiet 2>/dev/null || true
  fi
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT INT TERM

# --- Download DMG ---
DMG_NAME="${APP_NAME}_${VERSION_NUM}_${ARCH}.dmg"
DMG_URL="https://github.com/${REPO}/releases/download/${VERSION}/${DMG_NAME}"
DMG_PATH="${WORK_DIR}/${DMG_NAME}"

printf "Downloading %s...\n" "$DMG_NAME"
curl -fSL --progress-bar -o "$DMG_PATH" "$DMG_URL"

# --- Mount, copy, unmount ---
MOUNT_POINT=$(hdiutil attach "$DMG_PATH" -nobrowse -readonly \
  | grep -oE '/Volumes/\S+')

if [ -z "$MOUNT_POINT" ]; then
  printf "Error: failed to mount DMG\n" >&2
  exit 1
fi

APP_SRC="${MOUNT_POINT}/${APP_NAME}.app"
if [ ! -d "$APP_SRC" ]; then
  printf "Error: %s not found in DMG\n" "${APP_NAME}.app" >&2
  exit 1
fi

printf "Installing to /Applications...\n"
rm -rf "/Applications/${APP_NAME}.app"
cp -R "$APP_SRC" "/Applications/${APP_NAME}.app"

# Strip quarantine attribute so Gatekeeper allows unsigned app
xattr -cr "/Applications/${APP_NAME}.app"

printf "Done! %s has been installed to /Applications.\n" "$APP_NAME"
