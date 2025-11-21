import { IRoomRepository } from '../domain/interfaces/IRoomRepository';

export interface UpdateDisplayNameResult {
    success: boolean;
    roomId: string;
    participantId: string;
    displayName: string;
    error?: string;
}

export class UpdateDisplayNameUseCase {
    constructor(private readonly roomRepository: IRoomRepository) { }

    execute(roomId: string, participantId: string, displayName: string): UpdateDisplayNameResult {
        try {
            // Validate display name
            const trimmedName = displayName.trim();
            if (trimmedName.length === 0) {
                return {
                    success: false,
                    roomId,
                    participantId,
                    displayName: '',
                    error: 'Display name cannot be empty',
                };
            }

            if (trimmedName.length > 50) {
                return {
                    success: false,
                    roomId,
                    participantId,
                    displayName: '',
                    error: 'Display name is too long (max 50 characters)',
                };
            }

            const room = this.roomRepository.findRoom(roomId);
            if (!room) {
                return {
                    success: false,
                    roomId,
                    participantId,
                    displayName: '',
                    error: 'Room not found',
                };
            }

            const participant = room.getParticipant(participantId);
            if (!participant) {
                return {
                    success: false,
                    roomId,
                    participantId,
                    displayName: '',
                    error: 'Participant not found in room',
                };
            }

            // Update the participant's display name
            participant.displayName = trimmedName;

            return {
                success: true,
                roomId,
                participantId,
                displayName: trimmedName,
            };
        } catch (error) {
            return {
                success: false,
                roomId,
                participantId,
                displayName: '',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
