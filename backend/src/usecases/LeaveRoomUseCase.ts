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

export class LeaveRoomUseCase {
  constructor(private readonly roomRepository: IRoomRepository) {}

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

      room.removeParticipant(participantId);

      const remainingParticipants = room.getAllParticipants();

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

