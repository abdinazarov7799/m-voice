/**
 * Dependency Injection Container
 * 
 * This is the composition root for the frontend.
 * All dependencies are wired together here and provided via React Context.
 * 
 * SOLID Principle Applied: Dependency Inversion
 * Components depend on the IRoomManager abstraction, not concrete implementations.
 * 
 * Clean Architecture: This is where we assemble the application layers.
 */
import React, { createContext, useContext, useMemo } from 'react';
import { IRoomManager } from '../domain/interfaces/IRoomManager';
import { RoomManager } from '../usecases/RoomManager';
import { WebSocketAdapter } from '../infrastructure/WebSocketAdapter';
import { RTCAdapter } from '../infrastructure/RTCAdapter';

interface DIContainerProps {
  children: React.ReactNode;
}

// React Context for dependency injection
const RoomManagerContext = createContext<IRoomManager | null>(null);

/**
 * Dependency Injection Provider
 * Provides the RoomManager instance to all child components.
 */
export const DIContainer: React.FC<DIContainerProps> = ({ children }) => {
  const roomManager = useMemo(() => {
    // Infrastructure layer instances
    const signalingService = new WebSocketAdapter();
    const rtcService = new RTCAdapter();

    // Configuration from environment or defaults
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8081';
    const stunServers = [
      import.meta.env.VITE_STUN_SERVER || 'stun:stun.l.google.com:19302',
    ];

    // Compose the RoomManager use case with dependencies
    return new RoomManager(signalingService, rtcService, wsUrl, stunServers);
  }, []);

  return (
    <RoomManagerContext.Provider value={roomManager}>
      {children}
    </RoomManagerContext.Provider>
  );
};

/**
 * Custom hook to access the RoomManager.
 * This ensures components depend on the interface, not the concrete class.
 */
export const useRoomManager = (): IRoomManager => {
  const roomManager = useContext(RoomManagerContext);
  if (!roomManager) {
    throw new Error('useRoomManager must be used within DIContainer');
  }
  return roomManager;
};

