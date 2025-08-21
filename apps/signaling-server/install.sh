#!/bin/bash

echo "📦 Installing dependencies for Altamedica Signaling Server..."

# Navigate to signaling server directory
cd "$(dirname "$0")"

# Install dependencies
echo "Y" | pnpm install

echo "✅ Dependencies installed successfully!"