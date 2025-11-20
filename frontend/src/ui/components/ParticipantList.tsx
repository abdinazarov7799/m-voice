import React from 'react';
import { Participant } from '../../domain/entities/Participant';
import './ParticipantList.css';

interface ParticipantListProps {
  participants: Participant[];
  localParticipantId: string;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  localParticipantId,
}) => {
  if (participants.length === 0) {
    return (
      <div className="participant-list-empty">
        <p>No participants yet</p>
      </div>
    );
  }

  return (
    <ul className="participant-list" role="list">
      {participants.map((participant) => {
        const isLocal = participant.id === localParticipantId;

        return (
          <li
            key={participant.id}
            className={`participant-item ${isLocal ? 'local' : 'remote'}`}
          >
            <div className="participant-avatar">
              {isLocal ? '👤' : '🎧'}
            </div>
            <div className="participant-info">
              <span className="participant-name">
                {participant.getDisplayLabel()}
              </span>
              <span className="participant-status">
                {isLocal ? 'You' : 'Connected'}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

