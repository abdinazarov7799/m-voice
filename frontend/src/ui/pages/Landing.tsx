/**
 * UI Component: Landing Page
 * 
 * Landing page with two actions:
 * 1. Create a new room (generates a unique ID)
 * 2. Join an existing room by ID
 * 
 * Clean Architecture: This is a presentation layer component.
 * It depends only on domain utilities (generateRoomId) and React Router.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRoomId, isValidRoomId } from '../../domain/RoomIdGenerator';
import './Landing.css';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [roomIdInput, setRoomIdInput] = useState('');
  const [error, setError] = useState('');

  /**
   * Create a new room with a generated ID.
   */
  const handleCreateRoom = () => {
    const roomId = generateRoomId();
    navigate(`/room/${roomId}`);
  };

  /**
   * Join an existing room by ID.
   */
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedRoomId = roomIdInput.trim();

    if (!trimmedRoomId) {
      setError('Please enter a room ID');
      return;
    }

    if (!isValidRoomId(trimmedRoomId)) {
      setError('Invalid room ID format. Expected: YYYYMMDD-HHMMSS-XXXX');
      return;
    }

    navigate(`/room/${trimmedRoomId}`);
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        <header className="landing-header">
          <h1>🎤 M-Voice</h1>
          <p className="subtitle">Realtime Voice Chat with WebRTC</p>
        </header>

        <div className="landing-actions">
          <section className="action-card">
            <h2>Create New Room</h2>
            <p>Start a new voice chat room and invite others</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateRoom}
            >
              Create Room
            </button>
          </section>

          <div className="divider">
            <span>OR</span>
          </div>

          <section className="action-card">
            <h2>Join Existing Room</h2>
            <p>Enter a room ID to join an existing conversation</p>
            <form onSubmit={handleJoinRoom}>
              <input
                type="text"
                className="input"
                placeholder="e.g., 20251119-143052-a7k2"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                aria-label="Room ID"
              />
              {error && <p className="error-message" role="alert">{error}</p>}
              <button type="submit" className="btn btn-secondary">
                Join Room
              </button>
            </form>
          </section>
        </div>

        <footer className="landing-footer">
          <p>
            <strong>How it works:</strong> Create a room or enter an existing room ID.
            Share the URL with up to 4 others for voice chat.
          </p>
          <p className="tech-info">
            Powered by WebRTC (P2P) • Max 5 participants
          </p>
        </footer>
      </div>
    </div>
  );
};

