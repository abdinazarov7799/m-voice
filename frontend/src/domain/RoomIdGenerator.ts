/**
 * Domain Utility: Room ID Generator
 * 
 * Generates unique room IDs based on date/time and random suffix.
 * Format: YYYYMMDD-HHMMSS-XXXX
 * 
 * This is a pure domain utility with no external dependencies.
 */

/**
 * Generate a unique room ID.
 * 
 * Format: YYYYMMDD-HHMMSS-XXXX
 * - YYYYMMDD: Date (e.g., 20251119)
 * - HHMMSS: Time in 24h format (e.g., 143052)
 * - XXXX: Random base36 string (4 characters)
 * 
 * Example: 20251119-143052-a7k2
 * 
 * @returns A unique room ID string
 */
export function generateRoomId(): string {
  const now = new Date();

  // Format date: YYYYMMDD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;

  // Format time: HHMMSS
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timePart = `${hours}${minutes}${seconds}`;

  // Generate random suffix: 4 characters base36 (0-9, a-z)
  const randomSuffix = generateRandomBase36(4);

  return `${datePart}-${timePart}-${randomSuffix}`;
}

/**
 * Generate a random base36 string of specified length.
 * Base36 uses characters: 0-9, a-z (36 total characters)
 * 
 * @param length The length of the random string
 * @returns A random base36 string
 */
function generateRandomBase36(length: number): string {
  let result = '';
  const characters = '0123456789abcdefghijklmnopqrstuvwxyz';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

/**
 * Validate if a string matches the room ID format.
 * 
 * @param roomId The room ID to validate
 * @returns True if valid, false otherwise
 */
export function isValidRoomId(roomId: string): boolean {
  // Regex: YYYYMMDD-HHMMSS-XXXX
  const pattern = /^\d{8}-\d{6}-[a-z0-9]{4}$/;
  return pattern.test(roomId);
}

/**
 * Extract the timestamp from a room ID.
 * 
 * @param roomId The room ID
 * @returns Date object or null if invalid format
 */
export function extractTimestampFromRoomId(roomId: string): Date | null {
  if (!isValidRoomId(roomId)) {
    return null;
  }

  const parts = roomId.split('-');
  const datePart = parts[0];
  const timePart = parts[1];

  // TypeScript strict null checks: validate parts exist
  if (!datePart || !timePart || datePart.length !== 8 || timePart.length !== 6) {
    return null;
  }

  const year = parseInt(datePart.substring(0, 4), 10);
  const month = parseInt(datePart.substring(4, 6), 10) - 1; // 0-indexed
  const day = parseInt(datePart.substring(6, 8), 10);

  const hours = parseInt(timePart.substring(0, 2), 10);
  const minutes = parseInt(timePart.substring(2, 4), 10);
  const seconds = parseInt(timePart.substring(4, 6), 10);

  return new Date(year, month, day, hours, minutes, seconds);
}

