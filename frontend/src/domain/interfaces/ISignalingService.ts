export type SignalingMessage =
  | { type: 'joined'; youId: string; participants: Array<{ id: string; displayName?: string }> }
  | { type: 'participant-joined'; participant: { id: string; displayName?: string } }
  | { type: 'participant-left'; id: string }
  | { type: 'offer'; from: string; to: string; sdp: string }
  | { type: 'answer'; from: string; to: string; sdp: string }
  | { type: 'ice-candidate'; from: string; to: string; candidate: RTCIceCandidateInit }
  | { type: 'error'; message: string; code?: string };

export interface ISignalingService {
  connect(url: string): Promise<void>;

  disconnect(): void;

  joinRoom(roomId: string, displayName?: string): void;

  sendOffer(to: string, from: string, sdp: string): void;

  sendAnswer(to: string, from: string, sdp: string): void;

  sendIceCandidate(to: string, from: string, candidate: RTCIceCandidateInit): void;

  leaveRoom(participantId: string): void;

  onMessage(callback: (message: SignalingMessage) => void): void;

  onConnectionStateChange(callback: (connected: boolean) => void): void;
}

