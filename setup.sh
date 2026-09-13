#!/usr/bin/env bash

set -euo pipefail

echo ""
echo "=========================================="
echo " Three.js Motion Graphics Generator"
echo " Codespace initialization"
echo "=========================================="

cd "${WORKSPACE_FOLDER:-$(pwd)}"

# ============================================================
# Basic environment
# ============================================================

echo ""
echo "Environment:"
echo "  User:     $(whoami)"
echo "  Node:     $(node --version)"
echo "  npm:      $(npm --version)"
echo "  Python:   $(python --version)"
echo "  FFmpeg:   $(ffmpeg -version | head -n 1)"

# ============================================================
# OpenCode
#
# Installed here intentionally because the user requested
# OpenCode installation through postCreateCommand.
# ============================================================

echo ""
echo "=========================================="
echo " Installing OpenCode"
echo "=========================================="

if command -v opencode >/dev/null 2>&1; then
    echo "OpenCode is already installed."
else
    npm install -g opencode-ai
fi

echo ""
echo "OpenCode:"
opencode --version

# ============================================================
# Project dependencies
#
# This is safe when package.json does not exist yet.
# ============================================================

echo ""
echo "=========================================="
echo " Installing project dependencies"
echo "=========================================="

if [ -f package.json ]; then

    if [ -f pnpm-lock.yaml ]; then

        echo "Detected pnpm lockfile."
        pnpm install

    elif [ -f yarn.lock ]; then

        echo "Detected yarn lockfile."
        yarn install

    elif [ -f package-lock.json ]; then

        echo "Detected npm lockfile."
        npm ci

    else

        echo "No lockfile detected."
        npm install

    fi

else

    echo "No package.json found yet."
    echo "Skipping project dependency installation."

fi

# ============================================================
# Playwright verification
#
# NEVER use npx here.
# Playwright was installed globally in the Docker image.
# ============================================================

echo ""
echo "=========================================="
echo " Verifying Playwright"
echo "=========================================="

if command -v playwright >/dev/null 2>&1; then
    playwright --version
else
    echo "ERROR: Playwright executable was not found."
    exit 1
fi

# ============================================================
# Verify Chromium installation
# ============================================================

echo ""
echo "=========================================="
echo " Verifying Chromium"
echo "=========================================="

if [ -d "/ms-playwright" ]; then
    echo "Playwright browser directory exists."
else
    echo "ERROR: /ms-playwright does not exist."
    exit 1
fi

# ============================================================
# Final environment verification
# ============================================================

echo ""
echo "=========================================="
echo " Environment Ready"
echo "=========================================="

echo "User:       $(whoami)"
echo "Node:       $(node --version)"
echo "Python:     $(python --version)"
echo "FFmpeg:     $(ffmpeg -version | head -n 1)"
echo "OpenCode:   $(opencode --version)"
echo "Playwright: $(playwright --version)"

echo ""
echo "Three.js + OpenCode + Playwright + FFmpeg"
echo "motion graphics environment is ready."
echo ""