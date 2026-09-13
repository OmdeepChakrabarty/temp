FROM mcr.microsoft.com/devcontainers/javascript-node:22-bookworm

ENV DEBIAN_FRONTEND=noninteractive

# ============================================================
# System dependencies
# ============================================================

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    ffmpeg \
    imagemagick \
    jq \
    curl \
    wget \
    unzip \
    zip \
    xvfb \
    fonts-liberation \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

# ============================================================
# Python mathematical / procedural geometry environment
# ============================================================

RUN python3 -m venv /opt/venv

ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --no-cache-dir \
    numpy \
    scipy \
    sympy \
    pillow \
    matplotlib

# ============================================================
# Global Node development tools
# ============================================================

RUN npm install -g \
    pnpm \
    yarn \
    npm-check-updates \
    vite \
    typescript \
    tsx \
    eslint \
    prettier \
    playwright

# ============================================================
# Playwright browser environment
#
# IMPORTANT:
# Playwright is installed globally here so the bootstrap
# script never needs to use interactive npx package lookup.
# ============================================================

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN mkdir -p /ms-playwright \
    && chmod 777 /ms-playwright \
    && playwright install --with-deps chromium

# ============================================================
# Environment
# ============================================================

ENV NODE_ENV=development

# ============================================================
# Use the official non-root Node user
# ============================================================

USER node

WORKDIR /workspaces
