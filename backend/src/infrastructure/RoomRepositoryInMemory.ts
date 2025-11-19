/**
 * Infrastructure: In-Memory Room Repository
 * 
 * Concrete implementation of IRoomRepository using in-memory storage.
 * This implementation lives in the infrastructure layer and can be easily
 * replaced with a database-backed implementation without changing use cases.
 * 
 * SOLID Principles Applied:
 * - Dependency Inversion: Implements the IRoomRepository interface from domain layer
 * - Single Responsibility: Only responsible for room storage/retrieval
 * - Liskov Substitution: Can be swapped with any other IRoomRepository implementation
 * 
 * Clean Architecture: This is an infrastructure adapter that implements a domain interface.
 */
import { IRoomRepository } from '../domain/interfaces/IRoomRepository';
import { Room } from '../domain/entities/Room';

/**
 * RoomRepositoryInMemory stores rooms in a Map<roomId, Room>.
 * 
 * Note: In production, this could be replaced with Redis, PostgreSQL, etc.
 * The use cases would remain unchanged due to the abstraction.
 */
export class RoomRepositoryInMemory implements IRoomRepository {
  private readonly rooms: Map<string, Room> = new Map();

  /**
   * Create a new room with the given ID.
   * Throws if room already exists.
   */
  createRoom(roomId: string): Room {
    if (this.rooms.has(roomId)) {
      // Return existing room instead of throwing (idempotent)
      return this.rooms.get(roomId)!;
    }

    const room = new Room(roomId);
    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * Find a room by ID.
   * Returns undefined if not found.
   */
  findRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Delete a room by ID.
   * No-op if room doesn't exist.
   */
  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  /**
   * Check if a room exists.
   */
  roomExists(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  /**
   * Get all room IDs.
   * Useful for debugging and admin operations.
   */
  getAllRoomIds(): string[] {
    return Array.from(this.rooms.keys());
  }

  /**
   * Clear all rooms (useful for testing).
   */
  clear(): void {
    this.rooms.clear();
  }

  /**
   * Get the number of rooms (useful for monitoring).
   */
  getRoomCount(): number {
    return this.rooms.size;
  }
}

