/**
 * Domain Entity: Room
 * 
 * Represents a voice chat room containing participants.
 * Enforces business rules: max 5 participants, unique IDs.
 * 
 * SOLID Principle Applied: Single Responsibility Principle
 * This entity is responsible only for managing room state and participants.
 */
import { Participant } from './Participant';

export class Room {
  private readonly participants: Map<string, Participant> = new Map();
  private static readonly MAX_PARTICIPANTS = 5;

  constructor(public readonly id: string) {
    if (!id || id.trim().length === 0) {
      throw new Error('Room ID cannot be empty');
    }
  }

  /**
   * Add a participant to the room.
   * Enforces business rule: max 5 participants.
   */
  addParticipant(participant: Participant): void {
    if (this.participants.has(participant.id)) {
      throw new Error(`Participant ${participant.id} already in room`);
    }

    if (this.participants.size >= Room.MAX_PARTICIPANTS) {
      throw new Error(`Room is full (max ${Room.MAX_PARTICIPANTS} participants)`);
    }

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
   * Get all participants except the specified one.
   */
  getOtherParticipants(excludeId: string): Participant[] {
    return Array.from(this.participants.values()).filter((p) => p.id !== excludeId);
  }

  /**
   * Get all participants.
   */
  getAllParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  /**
   * Check if room is empty.
   */
  isEmpty(): boolean {
    return this.participants.size === 0;
  }

  /**
   * Check if room is full.
   */
  isFull(): boolean {
    return this.participants.size >= Room.MAX_PARTICIPANTS;
  }

  /**
   * Get participant count.
   */
  getParticipantCount(): number {
    return this.participants.size;
  }
}

