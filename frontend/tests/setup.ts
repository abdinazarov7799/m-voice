/**
 * Jest Setup File
 * 
 * Configures Jest and Testing Library for React component tests.
 */
import '@testing-library/jest-dom';

// Mock Web Audio API (not available in jsdom)
global.AudioContext = jest.fn().mockImplementation(() => ({
  createMediaStreamSource: jest.fn().mockReturnValue({
    connect: jest.fn(),
  }),
  createAnalyser: jest.fn().mockReturnValue({
    fftSize: 256,
    frequencyBinCount: 128,
    getByteFrequencyData: jest.fn(),
  }),
  close: jest.fn(),
}));

// Mock getUserMedia
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: jest.fn().mockReturnValue([
        {
          enabled: true,
          stop: jest.fn(),
        },
      ]),
      getAudioTracks: jest.fn().mockReturnValue([
        {
          enabled: true,
          stop: jest.fn(),
        },
      ]),
    }),
  },
  writable: true,
});

// Mock RTCPeerConnection
global.RTCPeerConnection = jest.fn().mockImplementation(() => ({
  addTrack: jest.fn(),
  createOffer: jest.fn().mockResolvedValue({ sdp: 'mock-offer-sdp', type: 'offer' }),
  createAnswer: jest.fn().mockResolvedValue({ sdp: 'mock-answer-sdp', type: 'answer' }),
  setLocalDescription: jest.fn().mockResolvedValue(undefined),
  setRemoteDescription: jest.fn().mockResolvedValue(undefined),
  addIceCandidate: jest.fn().mockResolvedValue(undefined),
  close: jest.fn(),
  connectionState: 'new',
  signalingState: 'stable',
  iceConnectionState: 'new',
  onicecandidate: null,
  ontrack: null,
  onconnectionstatechange: null,
  oniceconnectionstatechange: null,
  onnegotiationneeded: null,
}));

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  readyState: WebSocket.OPEN,
  onopen: null,
  onmessage: null,
  onclose: null,
  onerror: null,
})) as any;

// Add WebSocket constants
(global.WebSocket as any).CONNECTING = 0;
(global.WebSocket as any).OPEN = 1;
(global.WebSocket as any).CLOSING = 2;
(global.WebSocket as any).CLOSED = 3;

