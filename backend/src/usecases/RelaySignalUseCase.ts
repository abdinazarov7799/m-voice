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

export class RelaySignalUseCase {
  constructor(private readonly roomRepository: IRoomRepository) {}

  execute(roomId: string, message: SignalingMessage): RelaySignalResult {
    try {
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

      const room = this.roomRepository.findRoom(roomId);
      if (!room) {
        return {
          success: false,
          recipientId,
          message,
          error: 'Room not found',
        };
      }

      const sender = room.getParticipant(message.from);
      if (!sender) {
        return {
          success: false,
          recipientId,
          message,
          error: 'Sender not in room',
        };
      }

      const recipient = room.getParticipant(recipientId);
      if (!recipient) {
        return {
          success: false,
          recipientId,
          message,
          error: 'Recipient not in room',
        };
      }

      return {
        success: true,
        recipientId,
        message,
      };
    } catch (error) {
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