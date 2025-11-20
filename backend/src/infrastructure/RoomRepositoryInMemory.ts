import { IRoomRepository } from '../domain/interfaces/IRoomRepository';
import { Room } from '../domain/entities/Room';

export class RoomRepositoryInMemory implements IRoomRepository {
  private readonly rooms: Map<string, Room> = new Map();

  createRoom(roomId: string): Room {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!;
    }

    const room = new Room(roomId);
    this.rooms.set(roomId, room);
    return room;
  }

  findRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  roomExists(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  getAllRoomIds(): string[] {
    return Array.from(this.rooms.keys());
  }

  clear(): void {
    this.rooms.clear();
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}

