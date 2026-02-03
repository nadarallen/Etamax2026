#!/bin/bash

# Deployment Script for Etamax2026
# Usage: ./scripts/deploy.sh

set -e # Exit on error

echo "🚀 Starting deployment for Etamax2026..."

# 1. Pull latest changes
if [ -d ".git" ]; then
    echo "⬇️ Pulling latest changes from git..."
    git pull origin main
else
    echo "⚠️ .git directory not found. Skipping git pull."
fi

# 2. Rebuild and restart containers
echo "🐳 Rebuilding and restarting containers..."
docker compose up -d --build

# 4. Prune unused images
echo "🧹 Cleaning up..."
docker image prune -f

# 5. Create Super Admin (Idempotent: skips if exists)
echo "👑 Seeding Super Admin..."
docker compose exec -e NODE_PATH=/app/.next/standalone/node_modules app node scripts/seed-admin.js

echo "✅ Deployment successfully completed!"
echo "🌍 App should be live at your VPS IP address."
