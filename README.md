# M-Voice: Realtime Voice Chat with WebRTC Mesh (P2P)

A production-quality, minimal voice chat application supporting up to 5 users using WebRTC Mesh (P2P) architecture with Clean Architecture and SOLID principles.

## Architecture

This project follows **Clean Architecture** and **SOLID** principles:

- **Domain Layer**: Core business entities, interfaces, and value objects (framework-agnostic)
- **Use Cases Layer**: Application business logic orchestrating domain entities
- **Infrastructure Layer**: External implementations (WebSocket, WebRTC, Repositories)
- **Controllers/UI Layer**: Entry points and presentation logic

### Dependency Rule
Dependencies point inward: UI/Infrastructure → Use Cases → Domain. The domain layer has no external dependencies.

## Room ID Format

Room IDs are generated using a date/time-based unique format:
```
YYYYMMDD-HHMMSS-XXXX
```
- `YYYYMMDD`: Date (e.g., 20251119)
- `HHMMSS`: Time in 24h format (e.g., 143052)
- `XXXX`: Random base36 string (4 characters)

**Example**: `20251119-143052-a7k2`

This format ensures:
- Human-readable timestamps
- Collision resistance via random suffix
- Sortable by creation time

## WebRTC Architecture

### Mesh Topology (P2P)
Each client maintains a direct RTCPeerConnection to every other participant:
- **5 users** = 10 total peer connections (each user has 4 connections)
- Low latency (no media relay)
- Scales well up to 5-6 participants
- No server-side media processing

### Signaling Flow
1. Client A joins room with existing users [B, C]
2. Server sends `joined` message with B and C IDs
3. Client A creates offers for B and C
4. B and C respond with answers
5. ICE candidates are exchanged continuously
6. Media flows directly between peers

### STUN/TURN Configuration
- **Default STUN**: `stun:stun.l.google.com:19302` (for NAT traversal)
- **TURN**: Optional, configured via environment variables
- **Latency Expectations**:
  - LAN: 0-2ms
  - Internet (STUN): 20-80ms typical
  - TURN fallback: 50-150ms (media relayed through server)

## Prerequisites

- Node.js 18+ and npm
- Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)

## Project Structure

```
m-voice/
├── frontend/          # Vite + React + TypeScript
│   ├── src/
│   │   ├── domain/       # Business entities & interfaces
│   │   ├── usecases/     # Application logic
│   │   ├── infrastructure/ # WebSocket, WebRTC adapters
│   │   ├── ui/           # React components & pages
│   │   └── di/           # Dependency injection container
│   └── tests/
├── backend/           # Node.js + TypeScript + WebSocket
│   ├── src/
│   │   ├── domain/       # Entities, interfaces, types
│   │   ├── usecases/     # Business logic
│   │   ├── infrastructure/ # WebSocket server, repositories
│   │   └── controllers/  # Signaling controller
│   └── tests/
└── docker-compose.yml
```

## Getting Started

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Configure Environment

Create `backend/.env` (or use defaults):
```env
PORT=8080
WS_PORT=8081
STUN_SERVER=stun:stun.l.google.com:19302
# Optional TURN (commented by default)
# TURN_SERVER=turn:your-turn-server.com:3478
# TURN_USERNAME=username
# TURN_PASSWORD=password
```

### 3. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:8080` with WebSocket on `ws://localhost:8081`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173` (default Vite port)

### 4. Open Browser

Navigate to `http://localhost:5173`:
- Click **"Create Room"** to generate a new room
- Or enter a room ID and click **"Join Room"**
- Allow microphone access when prompted
- Share the room URL with others to join

## Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the dist/ folder with any static server
npm run preview  # or use nginx, serve, etc.
```

## Testing

**Backend Tests:**
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
```

**Frontend Tests:**
```bash
cd frontend
npm test
npm run test:watch
npm run test:coverage
```

Tests include:
- Unit tests for domain logic (RoomIdGenerator, RoomRepository)
- Use case tests (JoinRoom, LeaveRoom)
- Integration tests for signaling flow
- Audio level detector tests

## Docker Setup (Optional)

### Basic Setup (Backend + Frontend)
```bash
docker-compose up
```

### With TURN Server (for production NAT traversal)
Uncomment the `coturn` service in `docker-compose.yml` and configure:

1. Edit `docker-compose.yml` coturn environment variables
2. Set backend `TURN_SERVER`, `TURN_USERNAME`, `TURN_PASSWORD` in `.env`
3. Run:
```bash
docker-compose up
```

**Note**: TURN adds latency and should only be used as fallback for restrictive NATs.

## Code Quality Tools

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb TypeScript rules
- **Prettier**: Consistent formatting
- **Husky**: Pre-commit hooks (lint + format)

Run linting:
```bash
npm run lint
npm run lint:fix
```

Run formatting:
```bash
npm run format
```

## Signaling Protocol

All WebSocket messages are JSON with a `type` field:

### Client → Server

**Join Room:**
```json
{
  "type": "join",
  "roomId": "20251119-143052-a7k2",
  "displayName": "Alice"
}
```

**WebRTC Offer:**
```json
{
  "type": "offer",
  "to": "peer-uuid",
  "from": "my-uuid",
  "sdp": "v=0\r\no=- ..."
}
```

**WebRTC Answer:**
```json
{
  "type": "answer",
  "to": "peer-uuid",
  "from": "my-uuid",
  "sdp": "v=0\r\no=- ..."
}
```

**ICE Candidate:**
```json
{
  "type": "ice-candidate",
  "to": "peer-uuid",
  "from": "my-uuid",
  "candidate": { "candidate": "...", "sdpMid": "0", "sdpMLineIndex": 0 }
}
```

**Leave Room:**
```json
{
  "type": "leave",
  "from": "my-uuid"
}
```

### Server → Client

**Joined Confirmation:**
```json
{
  "type": "joined",
  "youId": "my-uuid",
  "participants": [
    { "id": "peer1-uuid", "displayName": "Bob" },
    { "id": "peer2-uuid", "displayName": "Charlie" }
  ]
}
```

**New Participant:**
```json
{
  "type": "participant-joined",
  "participant": { "id": "new-peer-uuid", "displayName": "Dave" }
}
```

**Participant Left:**
```json
{
  "type": "participant-left",
  "id": "peer-uuid"
}
```

## Limitations & Scaling

- **Max 5-6 users**: Mesh topology becomes CPU/bandwidth intensive beyond this
- **No persistence**: Rooms exist in-memory only
- **No recording**: Audio is peer-to-peer only
- **No authentication**: Open access (add auth layer for production)

For larger groups (10+), consider migrating to SFU (Selective Forwarding Unit) architecture.

## Troubleshooting

### No Audio from Peers
- Check browser console for errors
- Verify microphone permissions granted
- Check ICE connection state (should be "connected" or "completed")
- Try with STUN server enabled

### High Latency
- Check network conditions (ping times)
- Verify not using TURN unnecessarily
- Close other bandwidth-intensive applications

### Connection Fails
- Ensure WebSocket server is running
- Check firewall settings (WebSocket port must be open)
- For restrictive NATs, configure TURN server

## License

MIT

## Contributing

This is a reference implementation demonstrating Clean Architecture and WebRTC mesh topology. Feel free to extend with:
- Video support (add video tracks)
- Screen sharing
- Text chat (via DataChannel)
- Recording capabilities
- Persistent rooms (database)
- Authentication & authorization

