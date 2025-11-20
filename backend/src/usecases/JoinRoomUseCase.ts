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

export class JoinRoomUseCase {
  constructor(private readonly roomRepository: IRoomRepository) {}

  execute(roomId: string, participantId: string, displayName?: string): JoinRoomResult {
    try {
      let room = this.roomRepository.findRoom(roomId);
      if (!room) {
        room = this.roomRepository.createRoom(roomId);
      }

      if (room.isFull()) {
        return {
          success: false,
          participantId,
          room,
          existingParticipants: [],
          error: 'Room is full (maximum 5 participants)',
        };
      }

      const existingParticipants = room.getAllParticipants();

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

