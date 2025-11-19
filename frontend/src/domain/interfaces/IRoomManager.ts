/**
 * Domain Interface: IRoomManager
 * 
 * Defines the contract for room management use cases.
 * This is the main interface that the UI layer will interact with.
 * 
 * SOLID Principle Applied: Interface Segregation Principle (ISP)
 * This interface provides only the methods needed by the UI layer.
 */
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
  /**
   * Join a room.
   */
  joinRoom(roomId: string, displayName?: string): Promise<void>;

  /**
   * Leave the current room.
   */
  leaveRoom(): void;

  /**
   * Toggle mute/unmute local audio.
   */
  toggleMute(): void;

  /**
   * Get the current room state.
   */
  getRoomState(): RoomState;

  /**
   * Subscribe to room state changes.
   */
  onStateChange(callback: (state: RoomState) => void): () => void;

  /**
   * Get the local audio stream.
   */
  getLocalStream(): MediaStream | null;

  /**
   * Get a remote audio stream by participant ID.
   */
  getRemoteStream(participantId: string): MediaStream | null;
}

