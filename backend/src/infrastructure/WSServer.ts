/**
 * Infrastructure: WebSocket Server
 * 
 * Handles WebSocket connections and message routing.
 * This is a framework adapter that bridges WebSocket events to our use cases.
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Only handles WebSocket connection management
 * - Dependency Inversion: Depends on controller abstraction, not implementation
 * 
 * Clean Architecture: This is an infrastructure adapter. It knows about the 'ws' library
 * but the core domain and use cases know nothing about WebSockets.
 */
import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { SignalingController } from '../controllers/SignalingController';
import { ClientMessage, isClientMessage } from '../domain/types/SignalingMessages';

/**
 * Extended WebSocket type with custom properties for tracking state.
 */
interface ExtendedWebSocket extends WebSocket {
  id: string;
  roomId?: string;
  isAlive: boolean;
}

/**
 * WSServer manages WebSocket connections and delegates message handling to the controller.
 */
export class WSServer {
  private readonly wss: WebSocketServer;
  private readonly clients: Map<string, ExtendedWebSocket> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;

  /**
   * Constructor injection: SignalingController handles business logic.
   */
  constructor(
    private readonly port: number,
    private readonly signalingController: SignalingController,
  ) {
    this.wss = new WebSocketServer({ port });
    this.setupServer();
    this.startHeartbeat();
  }

  /**
   * Setup WebSocket server event handlers.
   */
  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const client = ws as ExtendedWebSocket;

      // Assign unique ID to this connection
      client.id = uuidv4();
      client.isAlive = true;
      this.clients.set(client.id, client);

      console.log(`[WSServer] Client connected: ${client.id}`);

      // Handle incoming messages
      client.on('message', (data: WebSocket.Data) => {
        this.handleMessage(client, data);
      });

      // Handle pong responses (heartbeat)
      client.on('pong', () => {
        client.isAlive = true;
      });

      // Handle client disconnect
      client.on('close', () => {
        this.handleDisconnect(client);
      });

      // Handle errors
      client.on('error', (error) => {
        console.error(`[WSServer] WebSocket error for client ${client.id}:`, error);
      });
    });

    console.log(`[WSServer] WebSocket server listening on port ${this.port}`);
  }

  /**
   * Handle incoming WebSocket message.
   */
  private handleMessage(client: ExtendedWebSocket, data: WebSocket.Data): void {
    try {
      // Parse JSON message
      const rawMessage = JSON.parse(data.toString());

      // Validate message structure
      if (!isClientMessage(rawMessage)) {
        this.sendError(client, 'Invalid message format');
        return;
      }

      const message = rawMessage as ClientMessage;

      // Delegate to controller (use case orchestration)
      this.signalingController.handleMessage(client.id, message, (recipientId, response) => {
        this.sendToClient(recipientId, response);
      });

      // Store room association for cleanup on disconnect
      if (message.type === 'join') {
        client.roomId = message.roomId;
      }
    } catch (error) {
      console.error(`[WSServer] Error handling message from ${client.id}:`, error);
      this.sendError(
        client,
        error instanceof Error ? error.message : 'Failed to process message',
      );
    }
  }

  /**
   * Handle client disconnect.
   */
  private handleDisconnect(client: ExtendedWebSocket): void {
    console.log(`[WSServer] Client disconnected: ${client.id}`);

    // Notify controller to handle leave logic
    if (client.roomId) {
      this.signalingController.handleDisconnect(client.id, client.roomId, (recipientId, message) => {
        this.sendToClient(recipientId, message);
      });
    }

    // Remove from clients map
    this.clients.delete(client.id);
  }

  /**
   * Send a message to a specific client.
   */
  private sendToClient(clientId: string, message: unknown): void {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    } else {
      console.warn(`[WSServer] Cannot send to client ${clientId}: not connected`);
    }
  }

  /**
   * Send an error message to a client.
   */
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

  /**
   * Start heartbeat mechanism to detect dead connections.
   * Sends ping every 30 seconds and terminates connections that don't respond.
   */
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

  /**
   * Gracefully shutdown the server.
   */
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

