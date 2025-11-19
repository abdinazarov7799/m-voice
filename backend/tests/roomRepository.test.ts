/**
 * Unit Tests: RoomRepositoryInMemory
 * 
 * Tests the in-memory room repository implementation.
 */
import { RoomRepositoryInMemory } from '../src/infrastructure/RoomRepositoryInMemory';

describe('RoomRepositoryInMemory', () => {
  let repository: RoomRepositoryInMemory;

  beforeEach(() => {
    repository = new RoomRepositoryInMemory();
  });

  describe('createRoom', () => {
    it('should create a new room', () => {
      const room = repository.createRoom('test-room-1');
      
      expect(room).toBeDefined();
      expect(room.id).toBe('test-room-1');
    });

    it('should return existing room if already exists (idempotent)', () => {
      const room1 = repository.createRoom('test-room-1');
      const room2 = repository.createRoom('test-room-1');
      
      expect(room1).toBe(room2);
    });
  });

  describe('findRoom', () => {
    it('should find an existing room', () => {
      repository.createRoom('test-room-1');
      const found = repository.findRoom('test-room-1');
      
      expect(found).toBeDefined();
      expect(found?.id).toBe('test-room-1');
    });

    it('should return undefined for non-existent room', () => {
      const found = repository.findRoom('non-existent');
      
      expect(found).toBeUndefined();
    });
  });

  describe('deleteRoom', () => {
    it('should delete an existing room', () => {
      repository.createRoom('test-room-1');
      repository.deleteRoom('test-room-1');
      
      const found = repository.findRoom('test-room-1');
      expect(found).toBeUndefined();
    });

    it('should handle deleting non-existent room gracefully', () => {
      expect(() => {
        repository.deleteRoom('non-existent');
      }).not.toThrow();
    });
  });

  describe('roomExists', () => {
    it('should return true for existing room', () => {
      repository.createRoom('test-room-1');
      
      expect(repository.roomExists('test-room-1')).toBe(true);
    });

    it('should return false for non-existent room', () => {
      expect(repository.roomExists('non-existent')).toBe(false);
    });
  });

  describe('getAllRoomIds', () => {
    it('should return empty array initially', () => {
      expect(repository.getAllRoomIds()).toEqual([]);
    });

    it('should return all room IDs', () => {
      repository.createRoom('room-1');
      repository.createRoom('room-2');
      repository.createRoom('room-3');
      
      const ids = repository.getAllRoomIds();
      expect(ids).toHaveLength(3);
      expect(ids).toContain('room-1');
      expect(ids).toContain('room-2');
      expect(ids).toContain('room-3');
    });
  });

  describe('clear', () => {
    it('should clear all rooms', () => {
      repository.createRoom('room-1');
      repository.createRoom('room-2');
      
      repository.clear();
      
      expect(repository.getAllRoomIds()).toEqual([]);
      expect(repository.getRoomCount()).toBe(0);
    });
  });

  describe('getRoomCount', () => {
    it('should return 0 initially', () => {
      expect(repository.getRoomCount()).toBe(0);
    });

    it('should return correct count', () => {
      repository.createRoom('room-1');
      repository.createRoom('room-2');
      
      expect(repository.getRoomCount()).toBe(2);
    });
  });
});

