/**
 * Domain Interface: IRoomRepository
 * 
 * Defines the contract for room persistence operations.
 * This is the abstraction that the domain layer depends on.
 * 
 * SOLID Principle Applied: Dependency Inversion Principle (DIP)
 * High-level modules (use cases) depend on this abstraction, not on concrete implementations.
 * The infrastructure layer will provide the concrete implementation.
 */
import { Room } from '../entities/Room';

export interface IRoomRepository {
  /**
   * Create a new room.
   */
  createRoom(roomId: string): Room;

  /**
   * Find a room by its ID.
   * Returns undefined if room doesn't exist.
   */
  findRoom(roomId: string): Room | undefined;

  /**
   * Delete a room.
   * Typically called when the room becomes empty.
   */
  deleteRoom(roomId: string): void;

  /**
   * Check if a room exists.
   */
  roomExists(roomId: string): boolean;

  /**
   * Get all room IDs (useful for debugging/admin).
   */
  getAllRoomIds(): string[];
}

