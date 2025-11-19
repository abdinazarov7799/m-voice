/**
 * Infrastructure Adapter: RTC Adapter
 * 
 * Concrete implementation of IRTCService using browser RTCPeerConnection API.
 * Manages multiple peer connections for mesh (P2P) topology.
 * 
 * SOLID Principles Applied:
 * - Dependency Inversion: Implements IRTCService from domain layer
 * - Single Responsibility: Only handles WebRTC peer connection logic
 * 
 * Clean Architecture: This is an infrastructure adapter that implements a domain interface.
 * 
 * Offer Collision Handling:
 * We implement a simple "polite" peer strategy based on peer ID comparison.
 * The peer with the lexicographically smaller ID is "polite" and will rollback on collision.
 */
import {
  IRTCService,
  RTCConfiguration,
  PeerConnectionCallbacks,
} from '../domain/interfaces/IRTCService';

interface PeerConnectionState {
  connection: RTCPeerConnection;
  callbacks: PeerConnectionCallbacks;
  makingOffer: boolean;
  ignoreOffer: boolean;
  isSettingRemoteAnswerPending: boolean;
}

export class RTCAdapter implements IRTCService {
  private peerConnections: Map<string, PeerConnectionState> = new Map();
  private localParticipantId: string | null = null;

  /**
   * Set the local participant ID (required for polite peer strategy).
   */
  setLocalParticipantId(id: string): void {
    this.localParticipantId = id;
  }

  /**
   * Create a peer connection to a remote peer.
   */
  createPeerConnection(
    peerId: string,
    config: RTCConfiguration,
    callbacks: PeerConnectionCallbacks,
  ): void {
    if (this.peerConnections.has(peerId)) {
      console.warn(`[RTCAdapter] Peer connection already exists for ${peerId}`);
      return;
    }

    // Create RTCPeerConnection with configuration
    const connection = new RTCPeerConnection(config);

    const state: PeerConnectionState = {
      connection,
      callbacks,
      makingOffer: false,
      ignoreOffer: false,
      isSettingRemoteAnswerPending: false,
    };

    this.peerConnections.set(peerId, state);

    // Setup event handlers
    this.setupConnectionHandlers(peerId, state);

    console.log(`[RTCAdapter] Created peer connection for ${peerId}`);
  }

  /**
   * Setup event handlers for a peer connection.
   */
  private setupConnectionHandlers(peerId: string, state: PeerConnectionState): void {
    const { connection, callbacks } = state;

    // ICE candidate events
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        callbacks.onIceCandidate(event.candidate);
      }
    };

    // Track events (receiving remote audio)
    connection.ontrack = (event) => {
      console.log(`[RTCAdapter] Received remote track from ${peerId}`);
      if (event.streams && event.streams[0]) {
        callbacks.onTrack(event.streams[0]);
      }
    };

    // Connection state changes
    connection.onconnectionstatechange = () => {
      console.log(`[RTCAdapter] Connection state for ${peerId}: ${connection.connectionState}`);
      callbacks.onConnectionStateChange(connection.connectionState);

      // Clean up failed connections
      if (connection.connectionState === 'failed' || connection.connectionState === 'closed') {
        this.closePeerConnection(peerId);
      }
    };

    // ICE connection state (for debugging)
    connection.oniceconnectionstatechange = () => {
      console.log(`[RTCAdapter] ICE connection state for ${peerId}: ${connection.iceConnectionState}`);
    };

    // Negotiation needed (for renegotiation, not needed in simple audio-only case)
    connection.onnegotiationneeded = async () => {
      try {
        state.makingOffer = true;
        const offer = await connection.createOffer();
        if (connection.signalingState !== 'stable') return;
        await connection.setLocalDescription(offer);
        // Note: In a full implementation, we'd send the offer here,
        // but we handle this explicitly via createOffer() method
      } catch (error) {
        console.error(`[RTCAdapter] Error during negotiation for ${peerId}:`, error);
      } finally {
        state.makingOffer = false;
      }
    };
  }

  /**
   * Add a local media stream to a peer connection.
   */
  addLocalStream(peerId: string, stream: MediaStream): void {
    const state = this.peerConnections.get(peerId);
    if (!state) {
      console.warn(`[RTCAdapter] No peer connection found for ${peerId}`);
      return;
    }

    // Add all tracks to the peer connection
    stream.getTracks().forEach((track) => {
      state.connection.addTrack(track, stream);
    });

    console.log(`[RTCAdapter] Added local stream to peer ${peerId}`);
  }

  /**
   * Create and return an offer SDP for a peer.
   */
  async createOffer(peerId: string): Promise<string> {
    const state = this.peerConnections.get(peerId);
    if (!state) {
      throw new Error(`No peer connection found for ${peerId}`);
    }

    try {
      state.makingOffer = true;
      const offer = await state.connection.createOffer({
        offerToReceiveAudio: true,
      });
      await state.connection.setLocalDescription(offer);
      return offer.sdp || '';
    } catch (error) {
      console.error(`[RTCAdapter] Error creating offer for ${peerId}:`, error);
      throw error;
    } finally {
      state.makingOffer = false;
    }
  }

  /**
   * Handle an incoming offer from a peer.
   * Returns the answer SDP.
   * 
   * Implements offer collision handling: if both peers send offers simultaneously,
   * the "polite" peer (with smaller ID) will rollback and accept the remote offer.
   */
  async handleOffer(peerId: string, sdp: string): Promise<string> {
    const state = this.peerConnections.get(peerId);
    if (!state) {
      throw new Error(`No peer connection found for ${peerId}`);
    }

    try {
      // Offer collision handling
      const offerCollision =
        state.makingOffer || state.connection.signalingState !== 'stable';

      // Determine if we are the "polite" peer (smaller ID = polite)
      const isPolite = this.localParticipantId ? this.localParticipantId < peerId : false;

      state.ignoreOffer = !isPolite && offerCollision;

      if (state.ignoreOffer) {
        console.log(`[RTCAdapter] Ignoring offer from ${peerId} (offer collision, we are impolite)`);
        return '';
      }

      // Set remote description
      await state.connection.setRemoteDescription({
        type: 'offer',
        sdp,
      });

      // Create answer
      const answer = await state.connection.createAnswer();
      await state.connection.setLocalDescription(answer);

      return answer.sdp || '';
    } catch (error) {
      console.error(`[RTCAdapter] Error handling offer from ${peerId}:`, error);
      throw error;
    }
  }

  /**
   * Handle an incoming answer from a peer.
   */
  async handleAnswer(peerId: string, sdp: string): Promise<void> {
    const state = this.peerConnections.get(peerId);
    if (!state) {
      throw new Error(`No peer connection found for ${peerId}`);
    }

    try {
      await state.connection.setRemoteDescription({
        type: 'answer',
        sdp,
      });
    } catch (error) {
      console.error(`[RTCAdapter] Error handling answer from ${peerId}:`, error);
      throw error;
    }
  }

  /**
   * Add an ICE candidate received from a peer.
   */
  async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const state = this.peerConnections.get(peerId);
    if (!state) {
      console.warn(`[RTCAdapter] No peer connection found for ${peerId}, ignoring ICE candidate`);
      return;
    }

    try {
      await state.connection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      // Ignore errors for ICE candidates (non-critical)
      if (!state.ignoreOffer) {
        console.error(`[RTCAdapter] Error adding ICE candidate for ${peerId}:`, error);
      }
    }
  }

  /**
   * Close a peer connection.
   */
  closePeerConnection(peerId: string): void {
    const state = this.peerConnections.get(peerId);
    if (state) {
      state.connection.close();
      this.peerConnections.delete(peerId);
      console.log(`[RTCAdapter] Closed peer connection for ${peerId}`);
    }
  }

  /**
   * Close all peer connections.
   */
  closeAllConnections(): void {
    this.peerConnections.forEach((state, peerId) => {
      state.connection.close();
      console.log(`[RTCAdapter] Closed peer connection for ${peerId}`);
    });
    this.peerConnections.clear();
  }

  /**
   * Get the connection state for a peer.
   */
  getConnectionState(peerId: string): RTCPeerConnectionState | undefined {
    const state = this.peerConnections.get(peerId);
    return state?.connection.connectionState;
  }

  /**
   * Get all active peer IDs.
   */
  getActivePeerIds(): string[] {
    return Array.from(this.peerConnections.keys());
  }
}

