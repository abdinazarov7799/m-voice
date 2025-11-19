/**
 * Server Entry Point (Composition Root)
 * 
 * This is where we wire up all dependencies and start the server.
 * 
 * SOLID Principle Applied: Dependency Inversion & Dependency Injection
 * All dependencies are instantiated here and injected into the classes that need them.
 * This is the only place in the application that knows about concrete implementations.
 * 
 * Clean Architecture: This is the main composition root where we assemble the application.
 * Dependencies flow inward: Infrastructure → Use Cases → Domain.
 */
import dotenv from 'dotenv';
import { RoomRepositoryInMemory } from './infrastructure/RoomRepositoryInMemory';
import { JoinRoomUseCase } from './usecases/JoinRoomUseCase';
import { LeaveRoomUseCase } from './usecases/LeaveRoomUseCase';
import { RelaySignalUseCase } from './usecases/RelaySignalUseCase';
import { SignalingController } from './controllers/SignalingController';
import { WSServer } from './infrastructure/WSServer';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env['PORT'] || '8080', 10);
const WS_PORT = parseInt(process.env['WS_PORT'] || '8081', 10);

/**
 * Bootstrap the application.
 * This function creates all dependencies and wires them together.
 */
function bootstrap(): void {
  console.log('='.repeat(60));
  console.log('🎤 M-Voice WebRTC Signaling Server');
  console.log('='.repeat(60));

  // ========================================
  // INFRASTRUCTURE LAYER
  // ========================================
  // Instantiate the room repository (in-memory implementation)
  // In production, this could be swapped with a Redis or PostgreSQL implementation
  const roomRepository = new RoomRepositoryInMemory();
  console.log('✓ Room Repository initialized (in-memory)');

  // ========================================
  // USE CASES LAYER
  // ========================================
  // Instantiate use cases with injected dependencies
  const joinRoomUseCase = new JoinRoomUseCase(roomRepository);
  const leaveRoomUseCase = new LeaveRoomUseCase(roomRepository);
  const relaySignalUseCase = new RelaySignalUseCase(roomRepository);
  console.log('✓ Use cases initialized');

  // ========================================
  // CONTROLLERS LAYER
  // ========================================
  // Instantiate the signaling controller
  const signalingController = new SignalingController(
    joinRoomUseCase,
    leaveRoomUseCase,
    relaySignalUseCase,
  );
  console.log('✓ Signaling controller initialized');

  // ========================================
  // INFRASTRUCTURE LAYER (WebSocket Server)
  // ========================================
  // Create and start the WebSocket server
  const wsServer = new WSServer(WS_PORT, signalingController);
  console.log(`✓ WebSocket server listening on port ${WS_PORT}`);

  // ========================================
  // CONFIGURATION
  // ========================================
  console.log('\n📡 Configuration:');
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

  // ========================================
  // GRACEFUL SHUTDOWN
  // ========================================
  const shutdown = (): void => {
    console.log('\n\n🛑 Shutting down gracefully...');
    wsServer.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Start the server
bootstrap();

