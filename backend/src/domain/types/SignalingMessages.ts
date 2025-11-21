interface BaseMessage {
  type: string;
}

export interface JoinMessage extends BaseMessage {
  type: 'join';
  roomId: string;
  displayName?: string;
}

export interface RTCIceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface JoinedMessage extends BaseMessage {
  type: 'joined';
  youId: string;
  participants: Array<{ id: string; displayName?: string }>;
  iceServers: RTCIceServerConfig[];
}

export interface OfferMessage extends BaseMessage {
  type: 'offer';
  to: string;
  from: string;
  sdp: string;
}

export interface AnswerMessage extends BaseMessage {
  type: 'answer';
  to: string;
  from: string;
  sdp: string;
}

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

export interface LeaveMessage extends BaseMessage {
  type: 'leave';
  from: string;
}

export interface ParticipantJoinedMessage extends BaseMessage {
  type: 'participant-joined';
  participant: { id: string; displayName?: string };
}

export interface ParticipantLeftMessage extends BaseMessage {
  type: 'participant-left';
  id: string;
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  message: string;
  code?: string;
}

export interface UpdateDisplayNameMessage extends BaseMessage {
  type: 'update-display-name';
  from: string;
  displayName: string;
}

export interface DisplayNameUpdatedMessage extends BaseMessage {
  type: 'display-name-updated';
  participantId: string;
  displayName: string;
}

export type ClientMessage =
  | JoinMessage
  | OfferMessage
  | AnswerMessage
  | IceCandidateMessage
  | LeaveMessage
  | UpdateDisplayNameMessage;

export type ServerMessage =
  | JoinedMessage
  | ParticipantJoinedMessage
  | ParticipantLeftMessage
  | OfferMessage
  | AnswerMessage
  | IceCandidateMessage
  | ErrorMessage
  | DisplayNameUpdatedMessage;

export function isClientMessage(msg: unknown): msg is ClientMessage {
  if (!msg || typeof msg !== 'object') return false;
  const message = msg as BaseMessage;
  return ['join', 'offer', 'answer', 'ice-candidate', 'leave', 'update-display-name'].includes(message.type);
}


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

export function isUpdateDisplayNameMessage(msg: ClientMessage): msg is UpdateDisplayNameMessage {
  return msg.type === 'update-display-name';
}

