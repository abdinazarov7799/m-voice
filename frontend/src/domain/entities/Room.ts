/**
 * Domain Entity: Room
 * 
 * Represents a voice chat room (frontend perspective).
 * Manages the collection of participants.
 */
import { Participant } from './Participant';

export class Room {
  private participants: Map<string, Participant> = new Map();

  constructor(
    public readonly id: string,
    public readonly localParticipantId: string,
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('Room ID cannot be empty');
    }
    if (!localParticipantId || localParticipantId.trim().length === 0) {
      throw new Error('Local participant ID cannot be empty');
    }
  }

  /**
   * Add a participant to the room.
   */
  addParticipant(participant: Participant): void {
    this.participants.set(participant.id, participant);
  }

  /**
   * Remove a participant from the room.
   */
  removeParticipant(participantId: string): void {
    this.participants.delete(participantId);
  }

  /**
   * Get a participant by ID.
   */
  getParticipant(participantId: string): Participant | undefined {
    return this.participants.get(participantId);
  }

  /**
   * Get all participants.
   */
  getAllParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  /**
   * Get remote participants (excluding local user).
   */
  getRemoteParticipants(): Participant[] {
    return Array.from(this.participants.values()).filter((p) => !p.isLocal);
  }

  /**
   * Get the local participant.
   */
  getLocalParticipant(): Participant | undefined {
    return this.participants.get(this.localParticipantId);
  }

  /**
   * Get participant count.
   */
  getParticipantCount(): number {
    return this.participants.size;
  }

  /**
   * Check if a participant exists.
   */
  hasParticipant(participantId: string): boolean {
    return this.participants.has(participantId);
  }
}

