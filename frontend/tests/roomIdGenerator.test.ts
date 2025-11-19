/**
 * Unit Tests: RoomIdGenerator
 * 
 * Tests the room ID generation utility.
 */
import {
  generateRoomId,
  isValidRoomId,
  extractTimestampFromRoomId,
} from '../src/domain/RoomIdGenerator';

describe('RoomIdGenerator', () => {
  describe('generateRoomId', () => {
    it('should generate a room ID in the correct format', () => {
      const roomId = generateRoomId();

      // Format: YYYYMMDD-HHMMSS-XXXX
      expect(roomId).toMatch(/^\d{8}-\d{6}-[a-z0-9]{4}$/);
    });

    it('should generate unique IDs', () => {
      const id1 = generateRoomId();
      const id2 = generateRoomId();

      // While extremely unlikely, IDs generated at the exact same millisecond
      // could theoretically be equal. In practice, this should never happen.
      expect(id1).not.toBe(id2);
    });

    it('should contain current date/time information', () => {
      const now = new Date();
      const roomId = generateRoomId();

      const year = now.getFullYear().toString();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      expect(roomId).toContain(`${year}${month}${day}`);
    });
  });

  describe('isValidRoomId', () => {
    it('should return true for valid room IDs', () => {
      expect(isValidRoomId('20251119-143052-a7k2')).toBe(true);
      expect(isValidRoomId('20230101-000000-0000')).toBe(true);
      expect(isValidRoomId('20991231-235959-zzzz')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isValidRoomId('20251119-143052')).toBe(false); // Missing suffix
      expect(isValidRoomId('2025119-143052-a7k2')).toBe(false); // Wrong date length
      expect(isValidRoomId('20251119-14305-a7k2')).toBe(false); // Wrong time length
      expect(isValidRoomId('20251119-143052-A7K2')).toBe(false); // Uppercase not allowed
      expect(isValidRoomId('20251119-143052-a7k')).toBe(false); // Suffix too short
      expect(isValidRoomId('')).toBe(false);
      expect(isValidRoomId('invalid')).toBe(false);
    });
  });

  describe('extractTimestampFromRoomId', () => {
    it('should extract timestamp from valid room ID', () => {
      const roomId = '20251119-143052-a7k2';
      const timestamp = extractTimestampFromRoomId(roomId);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp?.getFullYear()).toBe(2025);
      expect(timestamp?.getMonth()).toBe(10); // November (0-indexed)
      expect(timestamp?.getDate()).toBe(19);
      expect(timestamp?.getHours()).toBe(14);
      expect(timestamp?.getMinutes()).toBe(30);
      expect(timestamp?.getSeconds()).toBe(52);
    });

    it('should return null for invalid room ID', () => {
      expect(extractTimestampFromRoomId('invalid')).toBeNull();
      expect(extractTimestampFromRoomId('')).toBeNull();
      expect(extractTimestampFromRoomId('20251119-143052')).toBeNull();
    });

    it('should handle edge case dates', () => {
      const roomId = '20230101-000000-0000';
      const timestamp = extractTimestampFromRoomId(roomId);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp?.getFullYear()).toBe(2023);
      expect(timestamp?.getMonth()).toBe(0); // January
      expect(timestamp?.getDate()).toBe(1);
      expect(timestamp?.getHours()).toBe(0);
      expect(timestamp?.getMinutes()).toBe(0);
      expect(timestamp?.getSeconds()).toBe(0);
    });
  });
});

