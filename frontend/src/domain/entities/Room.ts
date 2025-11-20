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

  addParticipant(participant: Participant): void {
    this.participants.set(participant.id, participant);
  }

  removeParticipant(participantId: string): void {
    this.participants.delete(participantId);
  }

  getParticipant(participantId: string): Participant | undefined {
    return this.participants.get(participantId);
  }

  getAllParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  getRemoteParticipants(): Participant[] {
    return Array.from(this.participants.values()).filter((p) => !p.isLocal);
  }

  getLocalParticipant(): Participant | undefined {
    return this.participants.get(this.localParticipantId);
  }

  getParticipantCount(): number {
    return this.participants.size;
  }

  hasParticipant(participantId: string): boolean {
    return this.participants.has(participantId);
  }
}