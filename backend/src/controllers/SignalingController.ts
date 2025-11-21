import { JoinRoomUseCase } from '../usecases/JoinRoomUseCase';
import { LeaveRoomUseCase } from '../usecases/LeaveRoomUseCase';
import { RelaySignalUseCase } from '../usecases/RelaySignalUseCase';
import { UpdateDisplayNameUseCase } from '../usecases/UpdateDisplayNameUseCase';
import {
  ClientMessage,
  ServerMessage,
  OfferMessage,
  AnswerMessage,
  IceCandidateMessage,
  RTCIceServerConfig,
  isJoinMessage,
  isOfferMessage,
  isAnswerMessage,
  isIceCandidateMessage,
  isLeaveMessage,
  isUpdateDisplayNameMessage,
} from '../domain/types/SignalingMessages';

export type SendMessageCallback = (recipientId: string, message: ServerMessage) => void;

export class SignalingController {
  constructor(
    private readonly joinRoomUseCase: JoinRoomUseCase,
    private readonly leaveRoomUseCase: LeaveRoomUseCase,
    private readonly relaySignalUseCase: RelaySignalUseCase,
    private readonly updateDisplayNameUseCase: UpdateDisplayNameUseCase,
    private readonly iceServers: RTCIceServerConfig[],
  ) { }

  handleMessage(clientId: string, message: ClientMessage, sendMessage: SendMessageCallback, roomId?: string): void {
    try {
      if (isJoinMessage(message)) {
        this.handleJoin(clientId, message, sendMessage);
      } else if (isUpdateDisplayNameMessage(message)) {
        this.handleUpdateDisplayName(clientId, message, sendMessage, roomId);
      } else if (isOfferMessage(message) || isAnswerMessage(message) || isIceCandidateMessage(message)) {
        this.handleSignalingMessage(clientId, message, sendMessage, roomId);
      } else if (isLeaveMessage(message)) {
        this.handleLeave(clientId, message, sendMessage);
      } else {
        console.warn(`[SignalingController] Unknown message type from ${clientId}`);
        this.sendError(clientId, 'Unknown message type', sendMessage);
      }
    } catch (error) {
      console.error(`[SignalingController] Error handling message:`, error);
      this.sendError(
        clientId,
        error instanceof Error ? error.message : 'Internal server error',
        sendMessage,
      );
    }
  }

  handleDisconnect(clientId: string, roomId: string, sendMessage: SendMessageCallback): void {
    const result = this.leaveRoomUseCase.execute(roomId, clientId);

    if (result.success) {
      result.remainingParticipants.forEach((participant) => {
        sendMessage(participant.id, {
          type: 'participant-left',
          id: clientId,
        });
      });

      console.log(
        `[SignalingController] Client ${clientId} left room ${roomId}. Room deleted: ${result.roomDeleted}`,
      );
    }
  }

  private handleJoin(
    clientId: string,
    message: { type: 'join'; roomId: string; displayName?: string },
    sendMessage: SendMessageCallback,
  ): void {
    const result = this.joinRoomUseCase.execute(message.roomId, clientId, message.displayName);

    if (!result.success) {
      this.sendError(clientId, result.error || 'Failed to join room', sendMessage);
      return;
    }

    sendMessage(clientId, {
      type: 'joined',
      youId: clientId,
      participants: result.existingParticipants.map((p) => p.toJSON()),
      iceServers: this.iceServers,
    });

    result.existingParticipants.forEach((participant) => {
      sendMessage(participant.id, {
        type: 'participant-joined',
        participant: {
          id: clientId,
          displayName: message.displayName,
        },
      });
    });

    console.log(
      `[SignalingController] Client ${clientId} joined room ${message.roomId}. ` +
      `Total participants: ${result.room.getParticipantCount()}`,
    );
  }

  private handleSignalingMessage(
    clientId: string,
    message: OfferMessage | AnswerMessage | IceCandidateMessage,
    sendMessage: SendMessageCallback,
    roomId?: string,
  ): void {
    if (!roomId) {
      console.warn(`[SignalingController] Cannot relay ${message.type}: client ${clientId} not in a room`);
      this.sendError(clientId, 'Not in a room', sendMessage);
      return;
    }

    const result = this.relaySignalUseCase.execute(roomId, message);

    if (!result.success) {
      console.warn(
        `[SignalingController] Failed to relay ${message.type} from ${message.from} to ${message.to}: ${result.error}`,
      );
      this.sendError(clientId, result.error || 'Failed to relay message', sendMessage);
      return;
    }

    sendMessage(result.recipientId, result.message);
    console.log(`[SignalingController] Relayed ${message.type} from ${message.from} to ${result.recipientId}`);
  }

  private handleLeave(
    clientId: string,
    _message: { type: 'leave'; from: string },
    _sendMessage: SendMessageCallback,
  ): void {
    console.log(`[SignalingController] Client ${clientId} explicitly left`);
  }

  private sendError(clientId: string, message: string, sendMessage: SendMessageCallback): void {
    sendMessage(clientId, {
      type: 'error',
      message,
    });
  }

  private handleUpdateDisplayName(
    clientId: string,
    message: { type: 'update-display-name'; from: string; displayName: string },
    sendMessage: SendMessageCallback,
    roomId?: string,
  ): void {
    if (!roomId) {
      this.sendError(clientId, 'Not in a room', sendMessage);
      return;
    }

    const result = this.updateDisplayNameUseCase.execute(roomId, message.from, message.displayName);

    if (!result.success) {
      this.sendError(clientId, result.error || 'Failed to update display name', sendMessage);
      return;
    }

    // Broadcast to all participants in the room (including sender)
    const room = this.updateDisplayNameUseCase['roomRepository'].findRoom(roomId);
    if (room) {
      room.getAllParticipants().forEach((participant) => {
        sendMessage(participant.id, {
          type: 'display-name-updated',
          participantId: result.participantId,
          displayName: result.displayName,
        });
      });

      console.log(
        `[SignalingController] Updated display name for ${result.participantId} to "${result.displayName}"`,
      );
    }
  }
}

