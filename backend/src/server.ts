import dotenv from 'dotenv';
import { RoomRepositoryInMemory } from './infrastructure/RoomRepositoryInMemory';
import { JoinRoomUseCase } from './usecases/JoinRoomUseCase';
import { LeaveRoomUseCase } from './usecases/LeaveRoomUseCase';
import { RelaySignalUseCase } from './usecases/RelaySignalUseCase';
import { UpdateDisplayNameUseCase } from './usecases/UpdateDisplayNameUseCase';
import { SignalingController } from './controllers/SignalingController';
import { WSServer } from './infrastructure/WSServer';

dotenv.config();

const PORT = parseInt(process.env['PORT'] || '8080', 10);
const WS_PORT = parseInt(process.env['WS_PORT'] || '8081', 10);

function bootstrap(): void {
  const roomRepository = new RoomRepositoryInMemory();
  console.log('✓ Room Repository initialized (in-memory)');

  const joinRoomUseCase = new JoinRoomUseCase(roomRepository);
  const leaveRoomUseCase = new LeaveRoomUseCase(roomRepository);
  const relaySignalUseCase = new RelaySignalUseCase(roomRepository);
  const updateDisplayNameUseCase = new UpdateDisplayNameUseCase(roomRepository);
  console.log('✓ Use cases initialized');

  // Build ICE servers configuration from environment variables
  const iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [];

  // Always include STUN server
  const stunServer = process.env['STUN_SERVER'] || 'stun:stun.l.google.com:19302';
  iceServers.push({ urls: stunServer });

  // Add TURN server if configured
  if (process.env['TURN_SERVER']) {
    const turnConfig: { urls: string | string[]; username?: string; credential?: string } = {
      urls: process.env['TURN_SERVER'],
    };
    if (process.env['TURN_USERNAME']) {
      turnConfig.username = process.env['TURN_USERNAME'];
    }
    if (process.env['TURN_PASSWORD']) {
      turnConfig.credential = process.env['TURN_PASSWORD'];
    }
    iceServers.push(turnConfig);
  }

  const signalingController = new SignalingController(
    joinRoomUseCase,
    leaveRoomUseCase,
    relaySignalUseCase,
    updateDisplayNameUseCase,
    iceServers,
  );
  console.log('✓ Signaling controller initialized');

  const wsServer = new WSServer(WS_PORT, signalingController);
  console.log(`✓ WebSocket server listening on port ${WS_PORT}`);

  console.log(`   - HTTP Port: ${PORT}`);
  console.log(`   - WebSocket Port: ${WS_PORT}`);
  console.log(`   - STUN Server: ${process.env['STUN_SERVER'] || 'stun:stun.l.google.com:19302'}`);
  if (process.env['TURN_SERVER']) {
    console.log(`   - TURN Server: ${process.env['TURN_SERVER']}`);
    console.log(`   - TURN Username: ${process.env['TURN_USERNAME'] || 'not set'}`);
  } else {
    console.log('   - TURN Server: not configured (STUN only)');
  }

  console.log('\n🚀 Server is ready!');
  console.log('='.repeat(60));

  const shutdown = (): void => {
    console.log('\n\n🛑 Shutting down gracefully...');
    wsServer.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap();
