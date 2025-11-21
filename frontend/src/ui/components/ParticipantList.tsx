import React from 'react';
import { Participant } from '../../domain/entities/Participant';
import { ParticipantCard } from './ParticipantCard';
import './ParticipantList.css';

interface ParticipantListProps {
  participants: Participant[];
  localParticipantId: string;
  onVolumeChange: (participantId: string, volume: number) => void;
  getVolume: (participantId: string) => number;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  localParticipantId,
  onVolumeChange,
  getVolume,
}) => {
  if (participants.length === 0) {
    return (
      <div className="participant-list-empty">
        <p>No participants yet</p>
      </div>
    );
  }

  return (
    <div className="participant-list">
      {participants.map((participant) => {
        const isLocal = participant.id === localParticipantId;
        const volume = isLocal ? 1.0 : getVolume(participant.id);

        return (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            isLocal={isLocal}
            volume={volume}
            onVolumeChange={(vol) => onVolumeChange(participant.id, vol)}
          />
        );
      })}
    </div>
  );
};

