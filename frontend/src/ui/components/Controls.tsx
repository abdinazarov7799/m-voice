import React from 'react';
import './Controls.css';

interface ControlsProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ isMuted, onToggleMute }) => {
  return (
    <div className="controls">
      <button
        type="button"
        className={`btn-control ${isMuted ? 'muted' : 'unmuted'}`}
        onClick={onToggleMute}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        <span className="control-icon">{isMuted ? '🔇' : '🔊'}</span>
        <span className="control-label">{isMuted ? 'Unmute' : 'Mute'}</span>
      </button>
    </div>
  );
};

