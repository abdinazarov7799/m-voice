/**
 * Domain Entity: Participant
 * 
 * Represents a participant in a voice chat room (frontend perspective).
 * This entity tracks both local and remote participants.
 */

export interface ParticipantData {
  id: string;
  displayName?: string;
  isLocal: boolean;
}

export class Participant {
  constructor(
    public readonly id: string,
    public readonly displayName: string | undefined,
    public readonly isLocal: boolean,
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('Participant ID cannot be empty');
    }
  }

  /**
   * Create from JSON representation.
   */
  static fromJSON(data: { id: string; displayName?: string }, isLocal = false): Participant {
    return new Participant(data.id, data.displayName, isLocal);
  }

  /**
   * Convert to JSON for serialization.
   */
  toJSON(): { id: string; displayName?: string } {
    return {
      id: this.id,
      displayName: this.displayName,
    };
  }

  /**
   * Get display label for UI.
   */
  getDisplayLabel(): string {
    if (this.isLocal) {
      return this.displayName ? `${this.displayName} (You)` : 'You';
    }
    return this.displayName || `User ${this.id.substring(0, 6)}`;
  }
}

