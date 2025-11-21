export class Participant {
  constructor(
    public readonly id: string,
    public displayName?: string,
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('Participant ID cannot be empty');
    }
  }

  toJSON(): { id: string; displayName?: string } {
    return {
      id: this.id,
      displayName: this.displayName,
    };
  }

  static fromJSON(data: { id: string; displayName?: string }): Participant {
    return new Participant(data.id, data.displayName);
  }
}

