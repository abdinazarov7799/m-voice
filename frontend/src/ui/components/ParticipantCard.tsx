import React from 'react';
import { Participant } from '../../domain/entities/Participant';
import './ParticipantCard.css';

interface ParticipantCardProps {
    participant: Participant;
    isLocal: boolean;
    volume: number;
    onVolumeChange: (volume: number) => void;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
    participant,
    isLocal,
    volume,
    onVolumeChange,
}) => {
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        onVolumeChange(newVolume);
    };

    const formatVolume = (vol: number): string => {
        return `${Math.round(vol * 100)}%`;
    };

    return (
        <div className={`participant-card ${isLocal ? 'local' : 'remote'}`}>
            <div className="participant-avatar">
                {isLocal ? '👤' : '🎧'}
            </div>

            <div className="participant-details">
                <div className="participant-name-row">
                    <span className="participant-name">
                        {participant.getDisplayLabel()}
                    </span>
                    {isLocal && <span className="participant-badge">You</span>}
                </div>

                <div className="participant-status">
                    {isLocal ? 'Local Microphone' : 'Connected'}
                </div>
            </div>

            {!isLocal && (
                <div className="volume-control">
                    <span className="volume-icon">🔊</span>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="volume-slider"
                        aria-label={`Volume for ${participant.getDisplayLabel()}`}
                        style={{ '--volume-percent': `${(volume / 2) * 100}%` } as React.CSSProperties}
                    />
                    <span className="volume-label">{formatVolume(volume)}</span>
                </div>
            )}
        </div>
    );
};
