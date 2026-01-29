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

# 3. Clean up unused images
echo "🧹 Cleaning up unused docker images..."
docker image prune -f

echo "✅ Deployment successfully completed!"
echo "🌍 App should be live at your VPS IP address."
