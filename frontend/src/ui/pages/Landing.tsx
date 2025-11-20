import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRoomId, isValidRoomId } from '../../domain/RoomIdGenerator';
import './Landing.css';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [roomIdInput, setRoomIdInput] = useState('');
  const [error, setError] = useState('');

  const handleCreateRoom = () => {
    const roomId = generateRoomId();
    navigate(`/room/${roomId}`);
  };

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
        <h1 className="landing-title">Medias voice chat1</h1>
        <p className="landing-subtitle">Realtime Voice Chat for Teams</p>

        <div className="landing-actions">
          <button
            className="btn btn-primary btn-large"
            onClick={handleCreateRoom}
          >
            Create New Room
          </button>

          <div className="divider">or</div>

          <div className="join-form">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              className="room-input"
            />
            <button
              className="btn btn-secondary"
              onClick={handleJoinRoom}
              disabled={!roomIdInput.trim()}
            >
              Join Room
            </button>
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};
