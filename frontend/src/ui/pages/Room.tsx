/**
 * UI Component: Room Page
 * 
 * The main room page where voice chat happens.
 * Displays participants, audio controls, and handles WebRTC connections.
 * 
 * Clean Architecture: This is a presentation layer component.
 * It depends on the IRoomManager interface (not concrete implementation).
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoomManager } from '../../di/container';
import { RoomState } from '../../domain/interfaces/IRoomManager';
import { ParticipantList } from '../components/ParticipantList';
import { Controls } from '../components/Controls';
import { AudioLevelIndicator } from '../components/AudioLevelIndicator';
import './Room.css';

export const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const roomManager = useRoomManager();

  const [roomState, setRoomState] = useState<RoomState>(roomManager.getRoomState());
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(true);

  /**
   * Join room on mount.
   */
  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    const joinRoom = async () => {
      try {
        setIsJoining(true);
        setError(null);
        await roomManager.joinRoom(roomId);
        setIsJoining(false);
      } catch (err) {
        console.error('Failed to join room:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to join room. Please check microphone permissions.',
        );
        setIsJoining(false);
      }
    };

    joinRoom();

    // Subscribe to room state changes
    const unsubscribe = roomManager.onStateChange((state) => {
      setRoomState(state);
    });

    // Leave room on unmount
    return () => {
      unsubscribe();
      roomManager.leaveRoom();
    };
  }, [roomId, roomManager, navigate]);

  /**
   * Handle leave button click.
   */
  const handleLeave = () => {
    roomManager.leaveRoom();
    navigate('/');
  };

  /**
   * Handle mute toggle.
   */
  const handleToggleMute = () => {
    roomManager.toggleMute();
  };

  /**
   * Copy room URL to clipboard.
   */
  const handleCopyRoomUrl = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      alert('Room URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy URL:', err);
      alert('Failed to copy URL. Please copy manually from the address bar.');
    }
  };

  // Error state
  if (error) {
    return (
      <div className="room-container">
        <div className="error-container">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Joining state
  if (isJoining) {
    return (
      <div className="room-container">
        <div className="loading-container">
          <div className="spinner" />
          <p>Joining room...</p>
          <p className="loading-hint">Please allow microphone access when prompted</p>
        </div>
      </div>
    );
  }

  return (
    <div className="room-container">
      <div className="room-content">
        <header className="room-header">
          <div className="room-info">
            <h1>🎤 Voice Room</h1>
            <div className="room-id-container">
              <span className="room-id">Room: {roomId}</span>
              <button
                type="button"
                className="btn-icon"
                onClick={handleCopyRoomUrl}
                title="Copy room URL"
                aria-label="Copy room URL"
              >
                📋
              </button>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleLeave}
          >
            Leave Room
          </button>
        </header>

        <main className="room-main">
          <section className="participants-section">
            <h2>
              Participants ({roomState.participants.length}/{5})
            </h2>
            <ParticipantList
              participants={roomState.participants}
              localParticipantId={roomState.localParticipantId}
            />
          </section>

          <section className="audio-section">
            <h3>Your Audio</h3>
            <AudioLevelIndicator level={roomState.localAudioLevel} />
          </section>
        </main>

        <footer className="room-footer">
          <Controls
            isMuted={roomState.isMuted}
            onToggleMute={handleToggleMute}
          />
        </footer>
      </div>
    </div>
  );
};

