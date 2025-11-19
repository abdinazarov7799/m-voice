/**
 * Use Case: Room Manager
 * 
 * Orchestrates all room-related operations: joining, leaving, managing peers,
 * handling signaling, and managing WebRTC connections.
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Manages room state and peer connections
 * - Dependency Inversion: Depends on abstractions (ISignalingService, IRTCService)
 * - Open/Closed: Easy to extend with new features without modifying core logic
 * 
 * Clean Architecture: This is a use case that orchestrates domain entities and
 * infrastructure adapters. It has no knowledge of UI frameworks (React).
 */
import { ISignalingService, SignalingMessage } from '../domain/interfaces/ISignalingService';
import { IRTCService } from '../domain/interfaces/IRTCService';
import { IRoomManager, RoomState } from '../domain/interfaces/IRoomManager';
import { Room } from '../domain/entities/Room';
import { Participant } from '../domain/entities/Participant';

export class RoomManager implements IRoomManager {
  private room: Room | null = null;
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private stateChangeCallbacks: Set<(state: RoomState) => void> = new Set();
  private isMuted = false;
  private localAudioLevel = 0;
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;

  constructor(
    private readonly signalingService: ISignalingService,
    private readonly rtcService: IRTCService,
    private readonly wsUrl: string,
    private readonly stunServers: string[],
  ) {
    this.setupSignalingHandlers();
  }

  /**
   * Join a room.
   */
  async joinRoom(roomId: string, displayName?: string): Promise<void> {
    try {
      // Get microphone access
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      console.log('[RoomManager] Obtained microphone access');

      // Setup audio level monitoring
      this.setupAudioLevelMonitoring();

      // Connect to signaling server
      await this.signalingService.connect(this.wsUrl);
      console.log('[RoomManager] Connected to signaling server');

      // Join the room
      this.signalingService.joinRoom(roomId, displayName);
      console.log(`[RoomManager] Joining room: ${roomId}`);
    } catch (error) {
      console.error('[RoomManager] Error joining room:', error);
      throw error;
    }
  }

  /**
   * Leave the current room.
   */
  leaveRoom(): void {
    if (this.room) {
      this.signalingService.leaveRoom(this.room.localParticipantId);
    }

    // Close all peer connections
    this.rtcService.closeAllConnections();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Clean up audio monitoring
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.audioAnalyser = null;
    }

    // Disconnect from signaling server
    this.signalingService.disconnect();

    // Clear state
    this.room = null;
    this.remoteStreams.clear();

    console.log('[RoomManager] Left room');
    this.notifyStateChange();
  }

  /**
   * Toggle mute/unmute local audio.
   */
  toggleMute(): void {
    if (!this.localStream) return;

    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !this.isMuted;
    });

    console.log(`[RoomManager] Audio ${this.isMuted ? 'muted' : 'unmuted'}`);
    this.notifyStateChange();
  }

  /**
   * Get the current room state.
   */
  getRoomState(): RoomState {
    return {
      roomId: this.room?.id || '',
      localParticipantId: this.room?.localParticipantId || '',
      participants: this.room?.getAllParticipants() || [],
      isConnected: this.room !== null,
      isMuted: this.isMuted,
      localAudioLevel: this.localAudioLevel,
    };
  }

  /**
   * Subscribe to room state changes.
   */
  onStateChange(callback: (state: RoomState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => {
      this.stateChangeCallbacks.delete(callback);
    };
  }

  /**
   * Get the local audio stream.
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get a remote audio stream by participant ID.
   */
  getRemoteStream(participantId: string): MediaStream | null {
    return this.remoteStreams.get(participantId) || null;
  }

  /**
   * Setup signaling message handlers.
   */
  private setupSignalingHandlers(): void {
    this.signalingService.onMessage((message: SignalingMessage) => {
      this.handleSignalingMessage(message);
    });

    this.signalingService.onConnectionStateChange((connected: boolean) => {
      if (!connected && this.room) {
        console.warn('[RoomManager] Lost connection to signaling server');
      }
    });
  }

  /**
   * Handle incoming signaling messages.
   */
  private handleSignalingMessage(message: SignalingMessage): void {
    switch (message.type) {
      case 'joined':
        this.handleJoined(message);
        break;
      case 'participant-joined':
        this.handleParticipantJoined(message);
        break;
      case 'participant-left':
        this.handleParticipantLeft(message);
        break;
      case 'offer':
        this.handleOffer(message);
        break;
      case 'answer':
        this.handleAnswer(message);
        break;
      case 'ice-candidate':
        this.handleIceCandidate(message);
        break;
      case 'error':
        console.error('[RoomManager] Server error:', message.message);
        break;
      default:
        console.warn('[RoomManager] Unknown message type');
    }
  }

  /**
   * Handle 'joined' message (successful room join).
   */
  private handleJoined(message: { youId: string; participants: Array<{ id: string; displayName?: string }> }): void {
    console.log(`[RoomManager] Joined as ${message.youId}`);

    // Create room instance
    this.room = new Room(this.room?.id || '', message.youId);

    // Add local participant
    const localParticipant = new Participant(message.youId, undefined, true);
    this.room.addParticipant(localParticipant);

    // Add existing participants
    message.participants.forEach((p) => {
      const participant = Participant.fromJSON(p, false);
      this.room!.addParticipant(participant);
    });

    // Set local participant ID in RTC adapter (for polite peer strategy)
    if ('setLocalParticipantId' in this.rtcService) {
      (this.rtcService as any).setLocalParticipantId(message.youId);
    }

    // Create peer connections and send offers to existing participants
    message.participants.forEach((p) => {
      this.createPeerConnectionAndOffer(p.id);
    });

    this.notifyStateChange();
  }

  /**
   * Handle 'participant-joined' message (new participant joined).
   */
  private handleParticipantJoined(message: { participant: { id: string; displayName?: string } }): void {
    if (!this.room) return;

    console.log(`[RoomManager] Participant joined: ${message.participant.id}`);

    const participant = Participant.fromJSON(message.participant, false);
    this.room.addParticipant(participant);

    // Don't create offer here; the new participant will send offers to us
    // We'll create peer connection when we receive their offer

    this.notifyStateChange();
  }

  /**
   * Handle 'participant-left' message.
   */
  private handleParticipantLeft(message: { id: string }): void {
    if (!this.room) return;

    console.log(`[RoomManager] Participant left: ${message.id}`);

    this.room.removeParticipant(message.id);
    this.rtcService.closePeerConnection(message.id);
    this.remoteStreams.delete(message.id);

    this.notifyStateChange();
  }

  /**
   * Handle 'offer' message.
   */
  private async handleOffer(message: { from: string; to: string; sdp: string }): Promise<void> {
    if (!this.room || !this.localStream) return;

    console.log(`[RoomManager] Received offer from ${message.from}`);

    // Create peer connection if it doesn't exist
    if (!this.rtcService.getConnectionState(message.from)) {
      this.createPeerConnection(message.from);
      this.rtcService.addLocalStream(message.from, this.localStream);
    }

    try {
      // Handle offer and create answer
      const answerSdp = await this.rtcService.handleOffer(message.from, message.sdp);

      if (answerSdp) {
        // Send answer back
        this.signalingService.sendAnswer(message.from, message.to, answerSdp);
      }
    } catch (error) {
      console.error(`[RoomManager] Error handling offer from ${message.from}:`, error);
    }
  }

  /**
   * Handle 'answer' message.
   */
  private async handleAnswer(message: { from: string; to: string; sdp: string }): Promise<void> {
    console.log(`[RoomManager] Received answer from ${message.from}`);

    try {
      await this.rtcService.handleAnswer(message.from, message.sdp);
    } catch (error) {
      console.error(`[RoomManager] Error handling answer from ${message.from}:`, error);
    }
  }

  /**
   * Handle 'ice-candidate' message.
   */
  private async handleIceCandidate(message: { from: string; to: string; candidate: RTCIceCandidateInit }): Promise<void> {
    try {
      await this.rtcService.addIceCandidate(message.from, message.candidate);
    } catch (error) {
      console.error(`[RoomManager] Error adding ICE candidate from ${message.from}:`, error);
    }
  }

  /**
   * Create a peer connection and send an offer.
   */
  private async createPeerConnectionAndOffer(peerId: string): Promise<void> {
    if (!this.localStream || !this.room) return;

    this.createPeerConnection(peerId);
    this.rtcService.addLocalStream(peerId, this.localStream);

    try {
      const offerSdp = await this.rtcService.createOffer(peerId);
      this.signalingService.sendOffer(peerId, this.room.localParticipantId, offerSdp);
    } catch (error) {
      console.error(`[RoomManager] Error creating offer for ${peerId}:`, error);
    }
  }

  /**
   * Create a peer connection.
   */
  private createPeerConnection(peerId: string): void {
    const config = {
      iceServers: this.stunServers.map((url) => ({ urls: url })),
    };

    this.rtcService.createPeerConnection(peerId, config, {
      onIceCandidate: (candidate) => {
        if (this.room) {
          this.signalingService.sendIceCandidate(peerId, this.room.localParticipantId, candidate);
        }
      },
      onTrack: (stream) => {
        console.log(`[RoomManager] Received remote stream from ${peerId}`);
        this.remoteStreams.set(peerId, stream);
        this.notifyStateChange();
      },
      onConnectionStateChange: (state) => {
        console.log(`[RoomManager] Peer ${peerId} connection state: ${state}`);
      },
    });
  }

  /**
   * Setup audio level monitoring.
   */
  private setupAudioLevelMonitoring(): void {
    if (!this.localStream) return;

    try {
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 256;
      source.connect(this.audioAnalyser);

      this.startAudioLevelPolling();
    } catch (error) {
      console.error('[RoomManager] Error setting up audio level monitoring:', error);
    }
  }

  /**
   * Poll audio level.
   */
  private startAudioLevelPolling(): void {
    if (!this.audioAnalyser) return;

    const dataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);

    const poll = () => {
      if (!this.audioAnalyser || !this.localStream) return;

      this.audioAnalyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      this.localAudioLevel = Math.min(average / 255, 1);

      // Notify if level changed significantly
      if (Math.abs(this.localAudioLevel - this.getRoomState().localAudioLevel) > 0.05) {
        this.notifyStateChange();
      }

      requestAnimationFrame(poll);
    };

    poll();
  }

  /**
   * Notify all state change callbacks.
   */
  private notifyStateChange(): void {
    const state = this.getRoomState();
    this.stateChangeCallbacks.forEach((callback) => callback(state));
  }
}

