/**
 * Use Case: Relay Signal
 * 
 * Handles relaying WebRTC signaling messages (offer, answer, ICE candidates) between peers.
 * The server acts as a signaling relay only; it does not process media.
 * 
 * SOLID Principles Applied:
 * - Single Responsibility: Only validates and prepares signaling messages for relay
 * - Open/Closed: Easy to extend with new message types without modifying existing code
 * 
 * Clean Architecture: This use case knows nothing about WebSockets or transport layer.
 * It operates on domain types only.
 */
import {
  OfferMessage,
  AnswerMessage,
  IceCandidateMessage,
  isOfferMessage,
  isAnswerMessage,
  isIceCandidateMessage,
} from '../domain/types/SignalingMessages';
import { IRoomRepository } from '../domain/interfaces/IRoomRepository';

export type SignalingMessage = OfferMessage | AnswerMessage | IceCandidateMessage;

export interface RelaySignalResult {
  success: boolean;
  recipientId: string;
  message: SignalingMessage;
  error?: string;
}

/**
 * RelaySignalUseCase validates and prepares signaling messages for relay.
 * 
 * Note: The actual sending is handled by the infrastructure layer (WebSocket server).
 * This use case only validates the business logic (e.g., recipient exists in room).
 */
export class RelaySignalUseCase {
  constructor(private readonly roomRepository: IRoomRepository) {}

  /**
   * Execute the relay signal use case.
   * 
   * @param roomId The room where participants are communicating
   * @param message The signaling message to relay
   * @returns RelaySignalResult with validation status
   */
  execute(roomId: string, message: SignalingMessage): RelaySignalResult {
    try {
      // Validate message type and extract recipientId
      let recipientId: string;
      
      if (isOfferMessage(message)) {
        recipientId = message.to;
      } else if (isAnswerMessage(message)) {
        recipientId = message.to;
      } else if (isIceCandidateMessage(message)) {
        recipientId = message.to;
      } else {
        return {
          success: false,
          recipientId: '',
          message,
          error: 'Invalid signaling message type',
        };
      }

      // Validate room exists
      const room = this.roomRepository.findRoom(roomId);
      if (!room) {
        return {
          success: false,
          recipientId,
          message,
          error: 'Room not found',
        };
      }

      // Validate sender exists in room
      const sender = room.getParticipant(message.from);
      if (!sender) {
        return {
          success: false,
          recipientId,
          message,
          error: 'Sender not in room',
        };
      }

      // Validate recipient exists in room
      const recipient = room.getParticipant(recipientId);
      if (!recipient) {
        return {
          success: false,
          recipientId,
          message,
          error: 'Recipient not in room',
        };
      }

      // Validation passed; message is ready to be relayed
      return {
        success: true,
        recipientId,
        message,
      };
    } catch (error) {
      // Extract recipientId for error case
      const recipientId = 
        isOfferMessage(message) || isAnswerMessage(message) || isIceCandidateMessage(message)
          ? message.to
          : '';
      
      return {
        success: false,
        recipientId,
        message,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

