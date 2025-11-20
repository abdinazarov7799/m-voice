import { ISignalingService, SignalingMessage } from '../domain/interfaces/ISignalingService';
import { IRTCService } from '../domain/interfaces/IRTCService';
import { IRoomManager, RoomState } from '../domain/interfaces/IRoomManager';
import { Room } from '../domain/entities/Room';
import { Participant } from '../domain/entities/Participant';

export class RoomManager implements IRoomManager {
  private room: Room | null = null;
  private currentRoomId: string | null = null;
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
    private readonly iceServers: RTCIceServer[],
  ) {
    this.setupSignalingHandlers();
  }

  async joinRoom(roomId: string, displayName?: string): Promise<void> {
    try {
      this.currentRoomId = roomId;

      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      console.log('[RoomManager] Obtained microphone access');

      this.setupAudioLevelMonitoring();

      await this.signalingService.connect(this.wsUrl);
      console.log('[RoomManager] Connected to signaling server');

      this.signalingService.joinRoom(roomId, displayName);
      console.log(`[RoomManager] Joining room: ${roomId}`);
    } catch (error) {
      console.error('[RoomManager] Error joining room:', error);
      this.currentRoomId = null;
      throw error;
    }
  }

  leaveRoom(): void {
    if (this.room) {
      this.signalingService.leaveRoom(this.room.localParticipantId);
    }

    this.rtcService.closeAllConnections();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.audioAnalyser = null;
    }

    this.signalingService.disconnect();

    this.room = null;
    this.currentRoomId = null;
    this.remoteStreams.clear();

    console.log('[RoomManager] Left room');
    this.notifyStateChange();
  }

  toggleMute(): void {
    if (!this.localStream) return;

    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !this.isMuted;
    });

    console.log(`[RoomManager] Audio ${this.isMuted ? 'muted' : 'unmuted'}`);
    this.notifyStateChange();
  }

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

  onStateChange(callback: (state: RoomState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => {
      this.stateChangeCallbacks.delete(callback);
    };
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(participantId: string): MediaStream | null {
    return this.remoteStreams.get(participantId) || null;
  }

  async switchInputDevice(deviceId: string): Promise<void> {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
    } catch (error) {
      console.error('[RoomManager] Error switching input device:', error);
      throw error;
    }
  }

  async setOutputDevice(deviceId: string): Promise<void> {
    console.log(`[RoomManager] Set output device preference to ${deviceId}`);
  }

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

  private handleJoined(message: { youId: string; participants: Array<{ id: string; displayName?: string }> }): void {
    console.log(`[RoomManager] Joined as ${message.youId}`);

    if (!this.currentRoomId) {
      console.error('[RoomManager] Received joined message but no roomId stored');
      return;
    }

    this.room = new Room(this.currentRoomId, message.youId);

    const localParticipant = new Participant(message.youId, undefined, true);
    this.room.addParticipant(localParticipant);

    message.participants.forEach((p) => {
      const participant = Participant.fromJSON(p, false);
      this.room!.addParticipant(participant);
    });

    if ('setLocalParticipantId' in this.rtcService) {
      (this.rtcService as any).setLocalParticipantId(message.youId);
    }

    message.participants.forEach((p) => {
      this.createPeerConnectionAndOffer(p.id);
    });

    this.notifyStateChange();
  }

  private handleParticipantJoined(message: { participant: { id: string; displayName?: string } }): void {
    if (!this.room) return;

    console.log(`[RoomManager] Participant joined: ${message.participant.id}`);

    const participant = Participant.fromJSON(message.participant, false);
    this.room.addParticipant(participant);

    this.notifyStateChange();
  }

  private handleParticipantLeft(message: { id: string }): void {
    if (!this.room) return;

    console.log(`[RoomManager] Participant left: ${message.id}`);

    this.room.removeParticipant(message.id);
    this.rtcService.closePeerConnection(message.id);
    this.remoteStreams.delete(message.id);

    this.notifyStateChange();
  }

  private async handleOffer(message: { from: string; to: string; sdp: string }): Promise<void> {
    if (!this.room || !this.localStream) return;

    console.log(`[RoomManager] Received offer from ${message.from}`);

    if (!this.rtcService.getConnectionState(message.from)) {
      this.createPeerConnection(message.from);
      this.rtcService.addLocalStream(message.from, this.localStream);
    }

    try {
      const answerSdp = await this.rtcService.handleOffer(message.from, message.sdp);

      if (answerSdp) {
        this.signalingService.sendAnswer(message.from, message.to, answerSdp);
      }
    } catch (error) {
      console.error(`[RoomManager] Error handling offer from ${message.from}:`, error);
    }
  }

  private async handleAnswer(message: { from: string; to: string; sdp: string }): Promise<void> {
    console.log(`[RoomManager] Received answer from ${message.from}`);

    try {
      await this.rtcService.handleAnswer(message.from, message.sdp);
    } catch (error) {
      console.error(`[RoomManager] Error handling answer from ${message.from}:`, error);
    }
  }

  private async handleIceCandidate(message: { from: string; to: string; candidate: RTCIceCandidateInit }): Promise<void> {
    try {
      await this.rtcService.addIceCandidate(message.from, message.candidate);
    } catch (error) {
      console.error(`[RoomManager] Error adding ICE candidate from ${message.from}:`, error);
    }
  }

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

  private createPeerConnection(peerId: string): void {
    const config = {
      iceServers: this.iceServers,
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

  private startAudioLevelPolling(): void {
    if (!this.audioAnalyser) return;

    const dataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);

    const poll = () => {
      if (!this.audioAnalyser || !this.localStream) return;

      this.audioAnalyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      this.localAudioLevel = Math.min(average / 255, 1);

      if (Math.abs(this.localAudioLevel - this.getRoomState().localAudioLevel) > 0.05) {
        this.notifyStateChange();
      }

      requestAnimationFrame(poll);
    };

    poll();
  }

  private notifyStateChange(): void {
    const state = this.getRoomState();
    this.stateChangeCallbacks.forEach((callback) => callback(state));
  }
}

