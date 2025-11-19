/**
 * Domain Types: Signaling Messages
 * 
 * Strongly-typed definitions for all WebSocket signaling messages.
 * These types ensure type safety across the entire application.
 * 
 * SOLID Principle Applied: Interface Segregation Principle (ISP)
 * Each message type is clearly defined with only the fields it needs.
 */

/**
 * Base message interface for type discrimination.
 */
interface BaseMessage {
  type: string;
}

/**
 * Client → Server: Join a room
 */
export interface JoinMessage extends BaseMessage {
  type: 'join';
  roomId: string;
  displayName?: string;
}

/**
 * Server → Client: Confirmation of successful join
 */
export interface JoinedMessage extends BaseMessage {
  type: 'joined';
  youId: string;
  participants: Array<{ id: string; displayName?: string }>;
}

/**
 * Client → Server: WebRTC offer
 */
export interface OfferMessage extends BaseMessage {
  type: 'offer';
  to: string;
  from: string;
  sdp: string;
}

/**
 * Client → Server: WebRTC answer
 */
export interface AnswerMessage extends BaseMessage {
  type: 'answer';
  to: string;
  from: string;
  sdp: string;
}

/**
 * Client → Server: ICE candidate
 * 
 * Note: RTCIceCandidateInit is a browser type, so we define our own structure
 */
export interface IceCandidateInit {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

export interface IceCandidateMessage extends BaseMessage {
  type: 'ice-candidate';
  to: string;
  from: string;
  candidate: IceCandidateInit;
}

/**
 * Client → Server: Leave room
 */
export interface LeaveMessage extends BaseMessage {
  type: 'leave';
  from: string;
}

/**
 * Server → Client: New participant joined
 */
export interface ParticipantJoinedMessage extends BaseMessage {
  type: 'participant-joined';
  participant: { id: string; displayName?: string };
}

/**
 * Server → Client: Participant left
 */
export interface ParticipantLeftMessage extends BaseMessage {
  type: 'participant-left';
  id: string;
}

/**
 * Server → Client: Error occurred
 */
export interface ErrorMessage extends BaseMessage {
  type: 'error';
  message: string;
  code?: string;
}

/**
 * Union type of all client-to-server messages
 */
export type ClientMessage =
  | JoinMessage
  | OfferMessage
  | AnswerMessage
  | IceCandidateMessage
  | LeaveMessage;

/**
 * Union type of all server-to-client messages
 */
export type ServerMessage =
  | JoinedMessage
  | ParticipantJoinedMessage
  | ParticipantLeftMessage
  | OfferMessage
  | AnswerMessage
  | IceCandidateMessage
  | ErrorMessage;

/**
 * Type guard to validate if an unknown object is a valid client message.
 */
export function isClientMessage(msg: unknown): msg is ClientMessage {
  if (!msg || typeof msg !== 'object') return false;
  const message = msg as BaseMessage;
  return ['join', 'offer', 'answer', 'ice-candidate', 'leave'].includes(message.type);
}

/**
 * Type guard for specific message types.
 */
export function isJoinMessage(msg: ClientMessage): msg is JoinMessage {
  return msg.type === 'join';
}

export function isOfferMessage(msg: ClientMessage): msg is OfferMessage {
  return msg.type === 'offer';
}

export function isAnswerMessage(msg: ClientMessage): msg is AnswerMessage {
  return msg.type === 'answer';
}

export function isIceCandidateMessage(msg: ClientMessage): msg is IceCandidateMessage {
  return msg.type === 'ice-candidate';
}

export function isLeaveMessage(msg: ClientMessage): msg is LeaveMessage {
  return msg.type === 'leave';
}

