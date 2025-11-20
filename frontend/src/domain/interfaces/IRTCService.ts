export interface RTCConfiguration {
  iceServers: RTCIceServer[];
}

export interface PeerConnectionCallbacks {
  onIceCandidate: (candidate: RTCIceCandidate) => void;
  onTrack: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
}

export interface IRTCService {
  createPeerConnection(
    peerId: string,
    config: RTCConfiguration,
    callbacks: PeerConnectionCallbacks,
  ): void;

  addLocalStream(peerId: string, stream: MediaStream): void;

  createOffer(peerId: string): Promise<string>;

  handleOffer(peerId: string, sdp: string): Promise<string>;

  handleAnswer(peerId: string, sdp: string): Promise<void>;

  addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void>;

  closePeerConnection(peerId: string): void;

  closeAllConnections(): void;

  getConnectionState(peerId: string): RTCPeerConnectionState | undefined;

  getActivePeerIds(): string[];

  replaceTrack(peerId: string, track: MediaStreamTrack): Promise<void>;
}

