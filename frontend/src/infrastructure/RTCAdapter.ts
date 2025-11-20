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
  isNegotiating: boolean;
}

export class RTCAdapter implements IRTCService {
  private peerConnections: Map<string, PeerConnectionState> = new Map();
  private localParticipantId: string | null = null;

  setLocalParticipantId(id: string): void {
    this.localParticipantId = id;
  }

  createPeerConnection(
    peerId: string,
    config: RTCConfiguration,
    callbacks: PeerConnectionCallbacks,
  ): void {
    if (this.peerConnections.has(peerId)) {
      console.warn(`[RTCAdapter] Peer connection already exists for ${peerId}`);
      return;
    }

    const connection = new RTCPeerConnection(config);

    const state: PeerConnectionState = {
      connection,
      callbacks,
      makingOffer: false,
      ignoreOffer: false,
      isSettingRemoteAnswerPending: false,
      isNegotiating: false,
    };

    this.peerConnections.set(peerId, state);

    this.setupConnectionHandlers(peerId, state);

    console.log(`[RTCAdapter] Created peer connection for ${peerId}`);
  }

  private setupConnectionHandlers(peerId: string, state: PeerConnectionState): void {
    const { connection, callbacks } = state;

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        callbacks.onIceCandidate(event.candidate);
      }
    };

    connection.ontrack = (event) => {
      console.log(`[RTCAdapter] Received remote track from ${peerId}`);
      if (event.streams && event.streams[0]) {
        callbacks.onTrack(event.streams[0]);
      }
    };

    connection.onconnectionstatechange = () => {
      console.log(`[RTCAdapter] Connection state for ${peerId}: ${connection.connectionState}`);
      callbacks.onConnectionStateChange(connection.connectionState);

      if (connection.connectionState === 'failed' || connection.connectionState === 'closed') {
        this.closePeerConnection(peerId);
      }
    };

    connection.oniceconnectionstatechange = () => {
      console.log(`[RTCAdapter] ICE connection state for ${peerId}: ${connection.iceConnectionState}`);
    };

    connection.onnegotiationneeded = async () => {
      // Negotiation is handled manually via createOffer() calls
      // This event fires when tracks are added, but we handle offers explicitly
      console.log(`[RTCAdapter] Negotiation needed for ${peerId} (handled externally)`);
    };
  }

  addLocalStream(peerId: string, stream: MediaStream): void {
    const state = this.peerConnections.get(peerId);
    if (!state) {
      console.warn(`[RTCAdapter] No peer connection found for ${peerId}`);
      return;
    }

    stream.getTracks().forEach((track) => {
      state.connection.addTrack(track, stream);
    });

    console.log(`[RTCAdapter] Added local stream to peer ${peerId}`);
  }

  async createOffer(peerId: string): Promise<string> {
    const state = this.peerConnections.get(peerId);
    if (!state) {
      throw new Error(`No peer connection found for ${peerId}`);
    }

    // Prevent concurrent negotiations
    if (state.isNegotiating) {
      console.warn(`[RTCAdapter] Already negotiating with ${peerId}, skipping`);
      return '';
    }

    try {
      state.isNegotiating = true;
      state.makingOffer = true;

      // Check if we're in a stable state
      if (state.connection.signalingState !== 'stable') {
        console.warn(`[RTCAdapter] Signaling state not stable for ${peerId}: ${state.connection.signalingState}`);
        return '';
      }

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
      state.isNegotiating = false;
    }
  }

  async handleOffer(peerId: string, sdp: string): Promise<string> {
    const state = this.peerConnections.get(peerId);
    if (!state) {
      throw new Error(`No peer connection found for ${peerId}`);
    }

    try {
      const offerCollision =
        state.makingOffer || state.connection.signalingState !== 'stable';

      const isPolite = this.localParticipantId ? this.localParticipantId < peerId : false;

      state.ignoreOffer = !isPolite && offerCollision;

      if (state.ignoreOffer) {
        console.log(`[RTCAdapter] Ignoring offer from ${peerId} (offer collision, we are impolite)`);
        return '';
      }

      await state.connection.setRemoteDescription({
        type: 'offer',
        sdp,
      });

      const answer = await state.connection.createAnswer();
      await state.connection.setLocalDescription(answer);

      return answer.sdp || '';
    } catch (error) {
      console.error(`[RTCAdapter] Error handling offer from ${peerId}:`, error);
      throw error;
    }
  }

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

  async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const state = this.peerConnections.get(peerId);
    if (!state) {
      console.warn(`[RTCAdapter] No peer connection found for ${peerId}, ignoring ICE candidate`);
      return;
    }

    try {
      await state.connection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      if (!state.ignoreOffer) {
        console.error(`[RTCAdapter] Error adding ICE candidate for ${peerId}:`, error);
      }
    }
  }

  closePeerConnection(peerId: string): void {
    const state = this.peerConnections.get(peerId);
    if (state) {
      state.connection.close();
      this.peerConnections.delete(peerId);
      console.log(`[RTCAdapter] Closed peer connection for ${peerId}`);
    }
  }

  closeAllConnections(): void {
    this.peerConnections.forEach((state, peerId) => {
      state.connection.close();
      console.log(`[RTCAdapter] Closed peer connection for ${peerId}`);
    });
    this.peerConnections.clear();
  }

  getConnectionState(peerId: string): RTCPeerConnectionState | undefined {
    const state = this.peerConnections.get(peerId);
    return state?.connection.connectionState;
  }

  getActivePeerIds(): string[] {
    return Array.from(this.peerConnections.keys());
  }

  async replaceTrack(peerId: string, track: MediaStreamTrack): Promise<void> {
    const state = this.peerConnections.get(peerId);
    if (!state) {
      throw new Error(`No peer connection found for ${peerId}`);
    }

    const sender = state.connection.getSenders().find((s) => s.track?.kind === track.kind);
    if (sender) {
      await sender.replaceTrack(track);
      console.log(`[RTCAdapter] Replaced ${track.kind} track for ${peerId}`);
    } else {
      console.warn(`[RTCAdapter] No sender found for ${track.kind} track for ${peerId}`);
    }
  }
}

