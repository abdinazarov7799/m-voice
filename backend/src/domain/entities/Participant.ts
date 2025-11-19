/**
 * Domain Entity: Participant
 * 
 * Represents a user in a voice chat room.
 * This is a pure domain entity with no external dependencies.
 */
export class Participant {
  constructor(
    public readonly id: string,
    public readonly displayName?: string,
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('Participant ID cannot be empty');
    }
  }

  /**
   * Create a serializable representation for network transmission.
   * This ensures we don't leak internal state.
   */
  toJSON(): { id: string; displayName?: string } {
    return {
      id: this.id,
      displayName: this.displayName,
    };
  }

  /**
   * Factory method to create from JSON.
   */
  static fromJSON(data: { id: string; displayName?: string }): Participant {
    return new Participant(data.id, data.displayName);
  }
}

