/**
 * Domain Interface: IRTCService
 * 
 * Defines the contract for WebRTC peer connection management.
 * This abstraction allows the use case layer to be independent of browser WebRTC APIs.
 * 
 * SOLID Principle Applied: Dependency Inversion Principle (DIP)
 * The use cases depend on this interface, not on the concrete RTCPeerConnection implementation.
 */

export interface RTCConfiguration {
  iceServers: RTCIceServer[];
}

export interface PeerConnectionCallbacks {
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onTrack: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
}

export interface IRTCService {
  /**
   * Create a peer connection to a remote peer.
   */
  createPeerConnection(
    peerId: string,
    config: RTCConfiguration,
    callbacks: PeerConnectionCallbacks,
  ): void;

  /**
   * Add a local media stream to a peer connection.
   */
  addLocalStream(peerId: string, stream: MediaStream): void;

  /**
   * Create and return an offer SDP for a peer.
   */
  createOffer(peerId: string): Promise<string>;

  /**
   * Handle an incoming offer from a peer.
   */
  handleOffer(peerId: string, sdp: string): Promise<string>;

  /**
   * Handle an incoming answer from a peer.
   */
  handleAnswer(peerId: string, sdp: string): Promise<void>;

  /**
   * Add an ICE candidate received from a peer.
   */
  addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void>;

  /**
   * Close a peer connection.
   */
  closePeerConnection(peerId: string): void;

  /**
   * Close all peer connections.
   */
  closeAllConnections(): void;

  /**
   * Get the connection state for a peer.
   */
  getConnectionState(peerId: string): RTCPeerConnectionState | undefined;

  /**
   * Get all active peer IDs.
   */
  getActivePeerIds(): string[];
}

