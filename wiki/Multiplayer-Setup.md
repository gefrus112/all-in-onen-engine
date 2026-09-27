# Multiplayer Setup

## Starting the Relay Server

The multiplayer relay is a lightweight socket.io server that relays player state between browser sessions.

### Start the relay

```bash
./start-multiplayer.sh
```

This starts a Bun + socket.io server on port 3001.

### Verify it's running

```bash
curl http://localhost:3001/socket.io/?EIO=4&transport=polling
# Should return: 0{"sid":"...","upgrades":["websocket"],...}
```

## How It Works

1. The IDE auto-loads the socket.io client from CDN on startup
2. On connect, the client emits a `join` event with a random player name
3. The server broadcasts `player_joined` to all other clients
4. Each client sends `state_update` at 20 Hz with position/velocity/color
5. The server relays these updates to all other clients
6. On disconnect, the server broadcasts `player_left`

## Protocol

### Client → Server
- `join` — `{ room: "default", name: "Player-XXXX" }`
- `state_update` — `{ x, y, vx, vy, color: [r,g,b], name }`

### Server → Client
- `player_joined` — `{ id, x, y, color, name }`
- `player_left` — `{ id }`
- `state_update` — `{ id, x, y, vx, vy }`
- `room_state` — `{ players: [...] }`

## Playing Multiplayer

1. Start the relay: `./start-multiplayer.sh`
2. Open the IDE in 2+ browser tabs
3. Load the "Multiplayer Arena" template in each tab
4. Click Play in each tab
5. Each player's avatar appears in all other tabs in real-time

## Limits
- Up to 4 players per room
- 20 Hz update rate
- 5-second timeout for stale players
