import React, { createContext, useContext, useMemo } from 'react';
import { IRoomManager } from '../domain/interfaces/IRoomManager';
import { RoomManager } from '../usecases/RoomManager';
import { WebSocketAdapter } from '../infrastructure/WebSocketAdapter';
import { RTCAdapter } from '../infrastructure/RTCAdapter';

interface DIContainerProps {
  children: React.ReactNode;
}

const RoomManagerContext = createContext<IRoomManager | null>(null);

export const DIContainer: React.FC<DIContainerProps> = ({ children }) => {
  const roomManager = useMemo(() => {
    const signalingService = new WebSocketAdapter();
    const rtcService = new RTCAdapter();

    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://voice.mediasolutions.uz/ws';

    const iceServers: RTCIceServer[] = [
      { urls: import.meta.env.VITE_STUN_SERVER || 'stun:stun.l.google.com:19302' },
    ];

    const turnServer = import.meta.env.VITE_TURN_SERVER;
    const turnUsername = import.meta.env.VITE_TURN_USERNAME;
    const turnPassword = import.meta.env.VITE_TURN_PASSWORD;

    if (turnServer && turnUsername && turnPassword) {
      iceServers.push({
        urls: `turn:${turnServer}`,
        username: turnUsername,
        credential: turnPassword,
      });
      console.log('[DI] TURN server configured for NAT fallback');
    } else {
      console.log('[DI] TURN server not configured - using STUN only (P2P)');
    }

    return new RoomManager(signalingService, rtcService, wsUrl, iceServers);
  }, []);

  return (
    <RoomManagerContext.Provider value={roomManager}>
      {children}
    </RoomManagerContext.Provider>
  );
};

export const useRoomManager = (): IRoomManager => {
  const roomManager = useContext(RoomManagerContext);
  if (!roomManager) {
    throw new Error('useRoomManager must be used within DIContainer');
  }
  return roomManager;
};
