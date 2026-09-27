#!/bin/bash
# Start the Lapia multiplayer relay in the background.
# Run from the project root: ./start-multiplayer.sh
# Logs to /tmp/mp-relay.log
# Port: 3001

cd "$(dirname "$0")/mini-services/multiplayer-relay"

# Kill any existing relay
pkill -f "bun.*multiplayer-relay/index.ts" 2>/dev/null
sleep 1

# Start in background, fully detached
nohup bun index.ts > /tmp/mp-relay.log 2>&1 &
PID=$!
disown

# Wait briefly and check
sleep 2
if ps -p $PID > /dev/null 2>&1; then
  echo "✓ Multiplayer relay started (PID $PID, port 3001)"
  echo "  Logs: /tmp/mp-relay.log"
  echo "  WebSocket: ws://localhost:3001"
else
  echo "✗ Failed to start relay. Check /tmp/mp-relay.log"
  cat /tmp/mp-relay.log
  exit 1
fi
