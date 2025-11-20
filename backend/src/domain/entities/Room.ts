import { Participant } from './Participant';

export class Room {
  private readonly participants: Map<string, Participant> = new Map();
  private static readonly MAX_PARTICIPANTS = 5;

  constructor(public readonly id: string) {
    if (!id || id.trim().length === 0) {
      throw new Error('Room ID cannot be empty');
    }
  }

  addParticipant(participant: Participant): void {
    if (this.participants.has(participant.id)) {
      throw new Error(`Participant ${participant.id} already in room`);
    }

    if (this.participants.size >= Room.MAX_PARTICIPANTS) {
      throw new Error(`Room is full (max ${Room.MAX_PARTICIPANTS} participants)`);
    }

    this.participants.set(participant.id, participant);
  }

  removeParticipant(participantId: string): void {
    this.participants.delete(participantId);
  }

  getParticipant(participantId: string): Participant | undefined {
    return this.participants.get(participantId);
  }

  getOtherParticipants(excludeId: string): Participant[] {
    return Array.from(this.participants.values()).filter((p) => p.id !== excludeId);
  }

  getAllParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  isEmpty(): boolean {
    return this.participants.size === 0;
  }

  isFull(): boolean {
    return this.participants.size >= Room.MAX_PARTICIPANTS;
  }

  getParticipantCount(): number {
    return this.participants.size;
  }
}

