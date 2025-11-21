#!/bin/bash
# Fix Prisma TypeScript types

echo "🔧 Fixing Prisma types..."

# Kill any running TypeScript servers
pkill -f tsserver

# Clean Prisma client
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Regenerate
npx prisma generate

echo "✅ Done! Restart VS Code to pick up the new types."
echo "   Press Cmd+Shift+P and type 'Reload Window'"
