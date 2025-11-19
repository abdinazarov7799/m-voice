/**
 * Integration Tests: Signaling Flow
 * 
 * Tests the complete signaling flow with WebSocket connections.
 * This is a basic skeleton that can be expanded for full integration testing.
 */
import WebSocket from 'ws';
import { WSServer } from '../src/infrastructure/WSServer';
import { SignalingController } from '../src/controllers/SignalingController';
import { JoinRoomUseCase } from '../src/usecases/JoinRoomUseCase';
import { LeaveRoomUseCase } from '../src/usecases/LeaveRoomUseCase';
import { RelaySignalUseCase } from '../src/usecases/RelaySignalUseCase';
import { RoomRepositoryInMemory } from '../src/infrastructure/RoomRepositoryInMemory';

describe('Signaling Integration Tests', () => {
  let wsServer: WSServer;
  let port: number;

  beforeAll(() => {
    // Setup test server
    port = 9001; // Use a different port for testing
    const repository = new RoomRepositoryInMemory();
    const joinRoomUseCase = new JoinRoomUseCase(repository);
    const leaveRoomUseCase = new LeaveRoomUseCase(repository);
    const relaySignalUseCase = new RelaySignalUseCase(repository);
    const controller = new SignalingController(
      joinRoomUseCase,
      leaveRoomUseCase,
      relaySignalUseCase,
    );

    wsServer = new WSServer(port, controller);
  });

  afterAll(() => {
    wsServer.close();
  });

  it('should accept WebSocket connections', (done) => {
    const client = new WebSocket(`ws://localhost:${port}`);

    client.on('open', () => {
      expect(client.readyState).toBe(WebSocket.OPEN);
      client.close();
      done();
    });

    client.on('error', (error) => {
      done(error);
    });
  });

  it('should handle join room message', (done) => {
    const client = new WebSocket(`ws://localhost:${port}`);

    client.on('open', () => {
      client.send(
        JSON.stringify({
          type: 'join',
          roomId: 'test-room-1',
          displayName: 'Test User',
        }),
      );
    });

    client.on('message', (data: Buffer) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'joined') {
        expect(message.youId).toBeDefined();
        expect(message.participants).toEqual([]);
        client.close();
        done();
      }
    });

    client.on('error', (error) => {
      done(error);
    });
  });

  it('should notify existing participants when new participant joins', (done) => {
    const client1 = new WebSocket(`ws://localhost:${port}`);
    const client2 = new WebSocket(`ws://localhost:${port}`);
    let client1Joined = false;

    client1.on('open', () => {
      client1.send(
        JSON.stringify({
          type: 'join',
          roomId: 'test-room-2',
          displayName: 'User 1',
        }),
      );
    });

    client1.on('message', (data: Buffer) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'joined' && !client1Joined) {
        client1Joined = true;

        // Now connect second client
        client2.on('open', () => {
          client2.send(
            JSON.stringify({
              type: 'join',
              roomId: 'test-room-2',
              displayName: 'User 2',
            }),
          );
        });
      } else if (message.type === 'participant-joined') {
        expect(message.participant).toBeDefined();
        expect(message.participant.displayName).toBe('User 2');
        client1.close();
        client2.close();
        done();
      }
    });

    client1.on('error', (error) => {
      done(error);
    });
  });
});

