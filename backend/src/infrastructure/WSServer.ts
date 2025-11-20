import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { SignalingController } from '../controllers/SignalingController';
import { ClientMessage, isClientMessage } from '../domain/types/SignalingMessages';

interface ExtendedWebSocket extends WebSocket {
  id: string;
  roomId?: string;
  isAlive: boolean;
}

export class WSServer {
  private readonly wss: WebSocketServer;
  private readonly clients: Map<string, ExtendedWebSocket> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(
    private readonly port: number,
    private readonly signalingController: SignalingController,
  ) {
    this.wss = new WebSocketServer({ port });
    this.setupServer();
    this.startHeartbeat();
  }

  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const client = ws as ExtendedWebSocket;

      client.id = uuidv4();
      client.isAlive = true;
      this.clients.set(client.id, client);

      console.log(`[WSServer] Client connected: ${client.id}`);

      client.on('message', (data: WebSocket.Data) => {
        this.handleMessage(client, data);
      });

      client.on('pong', () => {
        client.isAlive = true;
      });

      client.on('close', () => {
        this.handleDisconnect(client);
      });

      client.on('error', (error) => {
        console.error(`[WSServer] WebSocket error for client ${client.id}:`, error);
      });
    });

    console.log(`[WSServer] WebSocket server listening on port ${this.port}`);
  }

  private handleMessage(client: ExtendedWebSocket, data: WebSocket.Data): void {
    try {
      const rawMessage = JSON.parse(data.toString());

      if (!isClientMessage(rawMessage)) {
        this.sendError(client, 'Invalid message format');
        return;
      }

      const message = rawMessage as ClientMessage;

      if (message.type === 'join') {
        client.roomId = message.roomId;
      }

      this.signalingController.handleMessage(
        client.id,
        message,
        (recipientId, response) => {
          this.sendToClient(recipientId, response);
        },
        client.roomId,
      );
    } catch (error) {
      console.error(`[WSServer] Error handling message from ${client.id}:`, error);
      this.sendError(
        client,
        error instanceof Error ? error.message : 'Failed to process message',
      );
    }
  }

  private handleDisconnect(client: ExtendedWebSocket): void {
    console.log(`[WSServer] Client disconnected: ${client.id}`);

    if (client.roomId) {
      this.signalingController.handleDisconnect(client.id, client.roomId, (recipientId, message) => {
        this.sendToClient(recipientId, message);
      });
    }

    this.clients.delete(client.id);
  }

  private sendToClient(clientId: string, message: unknown): void {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    } else {
      console.warn(`[WSServer] Cannot send to client ${clientId}: not connected`);
    }
  }

  private sendError(client: ExtendedWebSocket, message: string): void {
    if (client.readyState === WebSocket.OPEN) {
      client.send(
        JSON.stringify({
          type: 'error',
          message,
        }),
      );
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          console.log(`[WSServer] Terminating dead connection: ${client.id}`);
          client.terminate();
          this.clients.delete(client.id);
          return;
        }

        client.isAlive = false;
        client.ping();
      });
    }, 30000);
  }

  close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.clients.forEach((client) => {
      client.close();
    });

    this.wss.close(() => {
      console.log('[WSServer] Server closed');
    });
  }
}

