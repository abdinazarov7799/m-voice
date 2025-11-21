import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoomManager } from '../../di/container';
import { RoomState } from '../../domain/interfaces/IRoomManager';
import { ParticipantList } from '../components/ParticipantList';
import { Controls } from '../components/Controls';
import { AudioLevelIndicator } from '../components/AudioLevelIndicator';
import { DeviceSelector } from '../components/DeviceSelector';
import { RemoteAudio } from '../components/RemoteAudio';
import { DisplayNameEditor } from '../components/DisplayNameEditor';
import { AudioSettings } from '../components/AudioSettings';
import './Room.css';

export const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const roomManager = useRoomManager();

  const [roomState, setRoomState] = useState<RoomState>(roomManager.getRoomState());
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [outputDeviceId, setOutputDeviceId] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>(() => {
    return localStorage.getItem('m-voice-display-name') || '';
  });

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    let isCleanedUp = false;

    const joinRoom = async () => {
      try {
        setIsJoining(true);
        setError(null);
        await roomManager.joinRoom(roomId);
        if (!isCleanedUp) {
          setIsJoining(false);
        }
      } catch (err) {
        console.error('Failed to join room:', err);
        if (!isCleanedUp) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to join room. Please check microphone permissions.',
          );
          setIsJoining(false);
        }
      }
    };

    joinRoom();

    const unsubscribe = roomManager.onStateChange((state) => {
      if (!isCleanedUp) {
        setRoomState(state);
      }
    });

    return () => {
      isCleanedUp = true;
      unsubscribe();
      roomManager.leaveRoom();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const handleLeave = () => {
    roomManager.leaveRoom();
    navigate('/');
  };

  const handleToggleMute = () => {
    roomManager.toggleMute();
  };

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

  const handleInputDeviceChange = async (deviceId: string) => {
    try {
      await roomManager.switchInputDevice(deviceId);
    } catch (err) {
      console.error('Failed to switch input device:', err);
      alert('Failed to switch microphone');
    }
  };

  const handleOutputDeviceChange = (deviceId: string) => {
    setOutputDeviceId(deviceId);
    roomManager.setOutputDevice(deviceId);
  };

  const handleVolumeChange = (participantId: string, volume: number) => {
    roomManager.setRemotePeerVolume(participantId, volume);
  };

  const getParticipantVolume = (participantId: string): number => {
    return roomManager.getRemotePeerVolume(participantId);
  };

  const handleDisplayNameUpdate = (newName: string) => {
    setDisplayName(newName);
    roomManager.updateDisplayName(newName);
  };

  const handleNoiseSuppressionChange = (enabled: boolean) => {
    console.log(`[Room] Noise suppression ${enabled ? 'enabled' : 'disabled'}`);
    // Note: Changes will apply on next getUserMedia call or room rejoin
  };

  const handleMicrophoneGainChange = (gain: number) => {
    roomManager.setMicrophoneGain(gain);
  };

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
            <h1>🎤 Medias voice chat</h1>
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
          <div className="header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? 'Hide Settings' : '⚙️ Settings'}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleLeave}
            >
              Leave Room
            </button>
          </div>
        </header>

        {showSettings && (
          <section className="settings-section">
            <DisplayNameEditor
              currentDisplayName={displayName}
              onUpdate={handleDisplayNameUpdate}
            />
            <AudioSettings
              onNoiseSuppressionChange={handleNoiseSuppressionChange}
              onMicrophoneGainChange={handleMicrophoneGainChange}
            />
            <DeviceSelector
              onInputDeviceChange={handleInputDeviceChange}
              onOutputDeviceChange={handleOutputDeviceChange}
            />
          </section>
        )}

        <main className="room-main">
          <section className="participants-section">
            <h2>
              Participants ({roomState.participants.length}/{5})
            </h2>
            <ParticipantList
              participants={roomState.participants}
              localParticipantId={roomState.localParticipantId}
              onVolumeChange={handleVolumeChange}
              getVolume={getParticipantVolume}
            />
          </section>

          <section className="audio-section">
            <h3>Your Audio</h3>
            <AudioLevelIndicator level={roomState.localAudioLevel} />
          </section>

          {roomState.participants
            .filter((p) => p.id !== roomState.localParticipantId)
            .map((p) => (
              <RemoteAudio
                key={p.id}
                participantId={p.id}
                roomManager={roomManager}
                outputDeviceId={outputDeviceId}
              />
            ))}
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

