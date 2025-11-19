/**
 * Infrastructure Adapter: WebSocket Adapter
 * 
 * Concrete implementation of ISignalingService using browser WebSocket API.
 * This adapter bridges the gap between the domain layer and the browser's WebSocket.
 * 
 * SOLID Principles Applied:
 * - Dependency Inversion: Implements ISignalingService from domain layer
 * - Single Responsibility: Only handles WebSocket communication
 * 
 * Clean Architecture: This is an infrastructure adapter that implements a domain interface.
 */
import { ISignalingService, SignalingMessage } from '../domain/interfaces/ISignalingService';

export class WebSocketAdapter implements ISignalingService {
  private ws: WebSocket | null = null;
  private messageCallback: ((message: SignalingMessage) => void) | null = null;
  private connectionStateCallback: ((connected: boolean) => void) | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;

  /**
   * Connect to the signaling server.
   */
  async connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('[WebSocketAdapter] Connected to signaling server');
          this.reconnectAttempts = 0;
          this.connectionStateCallback?.(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = () => {
          console.log('[WebSocketAdapter] Disconnected from signaling server');
          this.connectionStateCallback?.(false);
          this.attemptReconnect(url);
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocketAdapter] WebSocket error:', error);
          reject(new Error('Failed to connect to signaling server'));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the signaling server.
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Join a room.
   */
  joinRoom(roomId: string, displayName?: string): void {
    this.sendMessage({
      type: 'join',
      roomId,
      displayName,
    });
  }

  /**
   * Send an offer to a peer.
   */
  sendOffer(to: string, from: string, sdp: string): void {
    this.sendMessage({
      type: 'offer',
      to,
      from,
      sdp,
    });
  }

  /**
   * Send an answer to a peer.
   */
  sendAnswer(to: string, from: string, sdp: string): void {
    this.sendMessage({
      type: 'answer',
      to,
      from,
      sdp,
    });
  }

  /**
   * Send an ICE candidate to a peer.
   */
  sendIceCandidate(to: string, from: string, candidate: RTCIceCandidateInit): void {
    this.sendMessage({
      type: 'ice-candidate',
      to,
      from,
      candidate,
    });
  }

  /**
   * Leave the current room.
   */
  leaveRoom(participantId: string): void {
    this.sendMessage({
      type: 'leave',
      from: participantId,
    });
  }

  /**
   * Register a callback for incoming signaling messages.
   */
  onMessage(callback: (message: SignalingMessage) => void): void {
    this.messageCallback = callback;
  }

  /**
   * Register a callback for connection state changes.
   */
  onConnectionStateChange(callback: (connected: boolean) => void): void {
    this.connectionStateCallback = callback;
  }

  /**
   * Handle incoming WebSocket message.
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as SignalingMessage;

      if (this.messageCallback) {
        this.messageCallback(message);
      }
    } catch (error) {
      console.error('[WebSocketAdapter] Failed to parse message:', error);
    }
  }

  /**
   * Send a message through the WebSocket.
   */
  private sendMessage(message: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocketAdapter] Cannot send message: WebSocket not connected');
    }
  }

  /**
   * Attempt to reconnect to the server.
   */
  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocketAdapter] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    console.log(
      `[WebSocketAdapter] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
    );

    this.reconnectTimeout = window.setTimeout(() => {
      this.connect(url).catch((error) => {
        console.error('[WebSocketAdapter] Reconnection failed:', error);
      });
    }, delay);
  }
}

