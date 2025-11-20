import { ISignalingService, SignalingMessage } from '../domain/interfaces/ISignalingService';

export class WebSocketAdapter implements ISignalingService {
  private ws: WebSocket | null = null;
  private messageCallback: ((message: SignalingMessage) => void) | null = null;
  private connectionStateCallback: ((connected: boolean) => void) | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;

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

  joinRoom(roomId: string, displayName?: string): void {
    // Check if WebSocket is ready before sending
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocketAdapter] Cannot join room: WebSocket not ready');
      return;
    }
    
    this.sendMessage({
      type: 'join',
      roomId,
      displayName,
    });
  }

  sendOffer(to: string, from: string, sdp: string): void {
    this.sendMessage({
      type: 'offer',
      to,
      from,
      sdp,
    });
  }

  sendAnswer(to: string, from: string, sdp: string): void {
    this.sendMessage({
      type: 'answer',
      to,
      from,
      sdp,
    });
  }

  sendIceCandidate(to: string, from: string, candidate: RTCIceCandidateInit): void {
    this.sendMessage({
      type: 'ice-candidate',
      to,
      from,
      candidate,
    });
  }

  leaveRoom(participantId: string): void {
    this.sendMessage({
      type: 'leave',
      from: participantId,
    });
  }

  onMessage(callback: (message: SignalingMessage) => void): void {
    this.messageCallback = callback;
  }

  onConnectionStateChange(callback: (connected: boolean) => void): void {
    this.connectionStateCallback = callback;
  }

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

  private sendMessage(message: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocketAdapter] Cannot send message: WebSocket not connected');
    }
  }

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

