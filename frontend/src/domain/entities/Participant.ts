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

  static fromJSON(data: { id: string; displayName?: string }, isLocal = false): Participant {
    return new Participant(data.id, data.displayName, isLocal);
  }

  toJSON(): { id: string; displayName?: string } {
    return {
      id: this.id,
      displayName: this.displayName,
    };
  }

  getDisplayLabel(): string {
    if (this.isLocal) {
      return this.displayName ? `${this.displayName} (You)` : 'You';
    }
    return this.displayName || `User ${this.id.substring(0, 6)}`;
  }
}

