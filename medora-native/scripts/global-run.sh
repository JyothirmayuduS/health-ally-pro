#!/bin/bash

# Ensure we have the right path
export PATH=$PATH:/opt/homebrew/bin:/usr/local/bin

echo "============================================="
echo "        🌐 MEDORA GLOBAL LAUNCHER 🌐       "
echo "        (Powered by Ngrok Tunneling)         "
echo "============================================="

# Kill old instances
killall cloudflared 2>/dev/null
killall ngrok 2>/dev/null
npx pm2 stop all 2>/dev/null >/dev/null
killall node 2>/dev/null
sleep 1

echo "[1/2] Initializing Ngrok Secure Tunneling..."
echo "      (Please wait for ngrok URL provisioning)"
echo ""

# Fallback clean-up
rm -f /tmp/ngrok.log

# We start expo with the --tunnel flag so it automatically 
# uses @expo/ngrok and sets up the network proxying seamlessly.
npx expo start --tunnel --port 8081
