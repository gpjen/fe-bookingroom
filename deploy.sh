#!/bin/bash

# Configuration
SERVER_USER="it-apps"
SERVER_IP="192.168.130.105"
SERVER_PATH="/home/it-apps/e-boking"
PORT="3031"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting PM2 Deployment to $SERVER_IP:$PORT..."

# 1. Build locally
echo "📦 1. Building Next.js app (standalone mode)..."
npm run build || { echo "❌ Build failed"; exit 1; }

# Check if standalone build exists
if [ ! -d ".next/standalone" ]; then
  echo "❌ Error: .next/standalone directory not found. Please ensure 'output: \"standalone\"' is enabled in next.config.ts"
  exit 1
fi

# 2. Prepare deployment artifacts
echo "📂 2. Packing artifacts..."
rm -rf temp_deploy
mkdir -p temp_deploy

# Copy standalone build
echo "   - Copying standalone files..."
cp -r .next/standalone/. temp_deploy/

# Copy static files (required for standalone)
echo "   - Copying static assets..."
# Use simple cp because rsync might not be available
cp -r public temp_deploy/public
# Remove uploads folder from temp_deploy to avoid overwriting server data
rm -rf temp_deploy/public/uploads

mkdir -p temp_deploy/.next
cp -r .next/static temp_deploy/.next/static

# Copy PM2 config
echo "   - Copying PM2 configuration..."
cp ecosystem.config.js temp_deploy/

# 3. Compress
echo "🗜️  3. Compressing files..."
tar -czf deploy_package.tar.gz -C temp_deploy .

# 4. Transfer to server
echo "🚚 4. Transferring compressed package to server..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $SERVER_PATH"
scp deploy_package.tar.gz $SERVER_USER@$SERVER_IP:$SERVER_PATH/

# 5. Deploy on server (Extract & PM2 Reload)
# We add 'npm install sharp' to fix the Linux binary issue
echo "🔄 5. Remote Deployment (PM2)..."
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && \
    echo '   - Extracting package...' && \
    tar -xzf deploy_package.tar.gz && \
    rm deploy_package.tar.gz && \
    echo '   - Ensuring uploads directory exists...' && \
    mkdir -p public/uploads/bookings && \
    echo '   - Installing Linux dependencies...' && \
    npm install sharp --no-save && \
    echo '   - Starting/Reloading PM2...' && \
    pm2 startOrReload ecosystem.config.js --update-env && \
    pm2 save && \
    pm2 list" || { echo "❌ Remote deployment failed"; exit 1; }

# Cleanup
echo "🧹 6. Cleanup..."
rm -rf temp_deploy deploy_package.tar.gz

echo "✅ Deployment Success! App running on Port $PORT via PM2."
