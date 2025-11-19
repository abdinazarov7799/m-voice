/**
 * Unit Tests: JoinRoomUseCase
 * 
 * Tests the join room use case logic.
 */
import { JoinRoomUseCase } from '../src/usecases/JoinRoomUseCase';
import { RoomRepositoryInMemory } from '../src/infrastructure/RoomRepositoryInMemory';

describe('JoinRoomUseCase', () => {
  let useCase: JoinRoomUseCase;
  let repository: RoomRepositoryInMemory;

  beforeEach(() => {
    repository = new RoomRepositoryInMemory();
    useCase = new JoinRoomUseCase(repository);
  });

  describe('execute', () => {
    it('should successfully join a new room', () => {
      const result = useCase.execute('room-1', 'user-1', 'Alice');

      expect(result.success).toBe(true);
      expect(result.participantId).toBe('user-1');
      expect(result.room.id).toBe('room-1');
      expect(result.existingParticipants).toHaveLength(0);
    });

    it('should join an existing room with other participants', () => {
      // First participant joins
      useCase.execute('room-1', 'user-1', 'Alice');

      // Second participant joins
      const result = useCase.execute('room-1', 'user-2', 'Bob');

      expect(result.success).toBe(true);
      expect(result.participantId).toBe('user-2');
      expect(result.existingParticipants).toHaveLength(1);
      expect(result.existingParticipants[0]?.id).toBe('user-1');
    });

    it('should fail when room is full (5 participants)', () => {
      // Fill the room with 5 participants
      for (let i = 1; i <= 5; i++) {
        useCase.execute('room-1', `user-${i}`, `User ${i}`);
      }

      // Try to add 6th participant
      const result = useCase.execute('room-1', 'user-6', 'User 6');

      expect(result.success).toBe(false);
      expect(result.error).toContain('full');
    });

    it('should handle participant already in room', () => {
      // Participant joins
      useCase.execute('room-1', 'user-1', 'Alice');

      // Same participant tries to join again
      const result = useCase.execute('room-1', 'user-1', 'Alice');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already in room');
    });

    it('should work without display name', () => {
      const result = useCase.execute('room-1', 'user-1');

      expect(result.success).toBe(true);
      expect(result.participantId).toBe('user-1');
    });
  });
});

