/**
 * Use Case: Leave Room
 * 
 * Orchestrates the business logic for a participant leaving a room.
 * Handles cleanup: removes participant and deletes empty rooms.
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Only handles leave room logic and cleanup
 * - Dependency Inversion: Depends on IRoomRepository abstraction
 */
import { IRoomRepository } from '../domain/interfaces/IRoomRepository';
import { Participant } from '../domain/entities/Participant';

export interface LeaveRoomResult {
  success: boolean;
  roomId: string;
  participantId: string;
  remainingParticipants: Participant[];
  roomDeleted: boolean;
  error?: string;
}

/**
 * LeaveRoomUseCase encapsulates the logic for leaving a room.
 */
export class LeaveRoomUseCase {
  constructor(private readonly roomRepository: IRoomRepository) {}

  /**
   * Execute the leave room use case.
   * 
   * @param roomId The ID of the room to leave
   * @param participantId The ID of the participant leaving
   * @returns LeaveRoomResult with success status and remaining participants
   */
  execute(roomId: string, participantId: string): LeaveRoomResult {
    try {
      const room = this.roomRepository.findRoom(roomId);

      if (!room) {
        return {
          success: false,
          roomId,
          participantId,
          remainingParticipants: [],
          roomDeleted: false,
          error: 'Room not found',
        };
      }

      // Remove participant
      room.removeParticipant(participantId);

      // Get remaining participants
      const remainingParticipants = room.getAllParticipants();

      // Clean up empty rooms (business rule: empty rooms are deleted)
      let roomDeleted = false;
      if (room.isEmpty()) {
        this.roomRepository.deleteRoom(roomId);
        roomDeleted = true;
      }

      return {
        success: true,
        roomId,
        participantId,
        remainingParticipants,
        roomDeleted,
      };
    } catch (error) {
      return {
        success: false,
        roomId,
        participantId,
        remainingParticipants: [],
        roomDeleted: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

