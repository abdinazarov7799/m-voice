/**
 * Use Case: Join Room
 * 
 * Orchestrates the business logic for a participant joining a room.
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Only handles join room logic
 * - Dependency Inversion: Depends on IRoomRepository abstraction, not concrete implementation
 * 
 * Clean Architecture: This is an application use case that orchestrates domain entities.
 * It has no knowledge of HTTP, WebSockets, or any external framework.
 */
import { IRoomRepository } from '../domain/interfaces/IRoomRepository';
import { Participant } from '../domain/entities/Participant';
import { Room } from '../domain/entities/Room';

export interface JoinRoomResult {
  success: boolean;
  participantId: string;
  room: Room;
  existingParticipants: Participant[];
  error?: string;
}

/**
 * JoinRoomUseCase encapsulates the logic for joining a room.
 * 
 * Constructor Injection: Dependencies are injected via constructor (Dependency Injection pattern).
 */
export class JoinRoomUseCase {
  constructor(private readonly roomRepository: IRoomRepository) {}

  /**
   * Execute the join room use case.
   * 
   * @param roomId The ID of the room to join
   * @param participantId Unique ID for the participant (e.g., UUID)
   * @param displayName Optional display name
   * @returns JoinRoomResult with success status and room data
   */
  execute(roomId: string, participantId: string, displayName?: string): JoinRoomResult {
    try {
      // Get or create room
      let room = this.roomRepository.findRoom(roomId);
      if (!room) {
        room = this.roomRepository.createRoom(roomId);
      }

      // Check if room is full
      if (room.isFull()) {
        return {
          success: false,
          participantId,
          room,
          existingParticipants: [],
          error: 'Room is full (maximum 5 participants)',
        };
      }

      // Get existing participants before adding the new one
      const existingParticipants = room.getAllParticipants();

      // Create and add participant
      const participant = new Participant(participantId, displayName);
      room.addParticipant(participant);

      return {
        success: true,
        participantId,
        room,
        existingParticipants,
      };
    } catch (error) {
      return {
        success: false,
        participantId,
        room: this.roomRepository.findRoom(roomId) || this.roomRepository.createRoom(roomId),
        existingParticipants: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

