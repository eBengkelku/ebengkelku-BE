#!/bin/sh

# Create dist directory and copy i18n files to correct location
mkdir -p dist/src
mkdir -p dist/i18n
cp -r src/i18n/* dist/i18n/ 2>/dev/null || true

# Start the application
pnpm run start:dev