import { Room } from '../entities/Room';

export interface IRoomRepository {
  createRoom(roomId: string): Room;

  findRoom(roomId: string): Room | undefined;

  deleteRoom(roomId: string): void;

  roomExists(roomId: string): boolean;

  getAllRoomIds(): string[];
}

