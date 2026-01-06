#!/bin/bash

# Docker build script for production optimization
set -e

echo "🚀 Building optimized Docker image for production..."

# Build arguments
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
VERSION=$(node -p "require('./package.json').version")

# Build the image with build args
docker build \
  --build-arg BUILD_DATE="$BUILD_DATE" \
  --build-arg GIT_COMMIT="$GIT_COMMIT" \
  --build-arg VERSION="$VERSION" \
  --target runner \
  --tag vinha-admin-center:latest \
  --tag vinha-admin-center:$VERSION \
  .

echo "✅ Docker image built successfully!"
echo "📦 Image tags: vinha-admin-center:latest, vinha-admin-center:$VERSION"

# Optional: Show image size
echo "📊 Image size:"
docker images vinha-admin-center:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo "🎯 To run the container:"
echo "docker run -p 9002:9002 --env-file .env vinha-admin-center:latest"