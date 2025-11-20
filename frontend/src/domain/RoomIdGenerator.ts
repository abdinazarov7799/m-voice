export function generateRoomId(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timePart = `${hours}${minutes}${seconds}`;

  const randomSuffix = generateRandomBase36(4);

  return `${datePart}-${timePart}-${randomSuffix}`;
}

function generateRandomBase36(length: number): string {
  let result = '';
  const characters = '0123456789abcdefghijklmnopqrstuvwxyz';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

export function isValidRoomId(roomId: string): boolean {
  const pattern = /^\d{8}-\d{6}-[a-z0-9]{4}$/;
  return pattern.test(roomId);
}

export function extractTimestampFromRoomId(roomId: string): Date | null {
  if (!isValidRoomId(roomId)) {
    return null;
  }

  const parts = roomId.split('-');
  const datePart = parts[0];
  const timePart = parts[1];

  if (!datePart || !timePart || datePart.length !== 8 || timePart.length !== 6) {
    return null;
  }

  const year = parseInt(datePart.substring(0, 4), 10);
  const month = parseInt(datePart.substring(4, 6), 10) - 1;
  const day = parseInt(datePart.substring(6, 8), 10);

  const hours = parseInt(timePart.substring(0, 2), 10);
  const minutes = parseInt(timePart.substring(2, 4), 10);
  const seconds = parseInt(timePart.substring(4, 6), 10);

  return new Date(year, month, day, hours, minutes, seconds);
}

