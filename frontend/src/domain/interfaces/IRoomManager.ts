import { Participant } from '../entities/Participant';

export interface RoomState {
  roomId: string;
  localParticipantId: string;
  participants: Participant[];
  isConnected: boolean;
  isMuted: boolean;
  localAudioLevel: number;
}

export interface IRoomManager {
  joinRoom(roomId: string, displayName?: string): Promise<void>;

  leaveRoom(): void;

  toggleMute(): void;

  getRoomState(): RoomState;

  onStateChange(callback: (state: RoomState) => void): () => void;

  getLocalStream(): MediaStream | null;

  getRemoteStream(participantId: string): MediaStream | null;

  switchInputDevice(deviceId: string): Promise<void>;

  setOutputDevice(deviceId: string): Promise<void>;
}

