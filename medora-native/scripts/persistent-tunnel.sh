#!/bin/bash

# Ensure node/npm are in the path for PM2
export PATH=$PATH:/opt/homebrew/bin:/usr/local/bin

echo "🚀 Starting Persistent Medora Tunnel..."
echo "🛡️ Hardware sleep prevention: ENABLED (caffeinate)"

# caffeinate -i ensures the system doesn't sleep as long as the command is running
CI=1 caffeinate -i npx expo start --tunnel
