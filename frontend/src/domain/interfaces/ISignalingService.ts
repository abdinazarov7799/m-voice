/**
 * Domain Interface: ISignalingService
 * 
 * Defines the contract for signaling communication.
 * This abstraction allows the domain/use-case layer to be independent of WebSocket implementation.
 * 
 * SOLID Principle Applied: Dependency Inversion Principle (DIP)
 * The use cases depend on this interface, not on a concrete WebSocket implementation.
 */

export type SignalingMessage =
  | { type: 'joined'; youId: string; participants: Array<{ id: string; displayName?: string }> }
  | { type: 'participant-joined'; participant: { id: string; displayName?: string } }
  | { type: 'participant-left'; id: string }
  | { type: 'offer'; from: string; to: string; sdp: string }
  | { type: 'answer'; from: string; to: string; sdp: string }
  | { type: 'ice-candidate'; from: string; to: string; candidate: RTCIceCandidateInit }
  | { type: 'error'; message: string; code?: string };

export interface ISignalingService {
  /**
   * Connect to the signaling server.
   */
  connect(url: string): Promise<void>;

  /**
   * Disconnect from the signaling server.
   */
  disconnect(): void;

  /**
   * Join a room.
   */
  joinRoom(roomId: string, displayName?: string): void;

  /**
   * Send an offer to a peer.
   */
  sendOffer(to: string, from: string, sdp: string): void;

  /**
   * Send an answer to a peer.
   */
  sendAnswer(to: string, from: string, sdp: string): void;

  /**
   * Send an ICE candidate to a peer.
   */
  sendIceCandidate(to: string, from: string, candidate: RTCIceCandidateInit): void;

  /**
   * Leave the current room.
   */
  leaveRoom(participantId: string): void;

  /**
   * Register a callback for incoming signaling messages.
   */
  onMessage(callback: (message: SignalingMessage) => void): void;

  /**
   * Register a callback for connection state changes.
   */
  onConnectionStateChange(callback: (connected: boolean) => void): void;
}

