#!/bin/bash

export PATH=$PATH:/opt/homebrew/bin:/usr/local/bin

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║       🏥  MEDORA  CLINICAL  SUITE        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Kill any stale processes
killall node 2>/dev/null
sleep 1

# Start Expo on LAN (port 8081) in background with forced tunnel hostname
echo "🚀 Starting Expo Metro Bundler..."
REACT_NATIVE_PACKAGER_HOSTNAME="medora-ally.loca.lt" npx expo start --lan --port 8081 &
EXPO_PID=$!
echo "   Expo PID: $EXPO_PID"

# Wait for Metro to be ready
echo "⏳ Waiting for Metro to start (15s)..."
sleep 15

# Check Metro is actually up
if ! curl -s http://localhost:8081/status | grep -q "packager-status:running"; then
  echo "⚠️  Metro not ready yet, waiting 10 more seconds..."
  sleep 10
fi

# Start Localtunnel — no browser warning, works everywhere
echo ""
echo "🌐 Starting global tunnel on port 8081..."
lt --port 8081 --subdomain medora-ally 2>&1 | tee /tmp/lt-output.txt &
LT_PID=$!

sleep 5

# Read the tunnel URL
LT_URL=$(grep -o 'https://[^ ]*' /tmp/lt-output.txt | head -1)

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║          ✅  MEDORA IS LIVE!             ║"
echo "╠══════════════════════════════════════════╣"
echo "║"
echo "║  📱 EXPO GO (scan QR in terminal above)"
echo "║     exp://192.168.29.25:8081"
echo "║"
echo "║  🌐 GLOBAL URL (browser + Expo Go)"
echo "║     $LT_URL"
echo "║"
echo "║  📲 EXPO GO via tunnel:"
echo "║     Paste in Expo Go search bar:"
echo "║     exp+medora://expo-development-client"
echo "║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Press Ctrl+C to stop everything."

# Wait for both
wait $EXPO_PID $LT_PID
