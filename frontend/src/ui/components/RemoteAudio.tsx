import React, { useEffect, useRef } from 'react';
import { IRoomManager } from '../../domain/interfaces/IRoomManager';

interface RemoteAudioProps {
    participantId: string;
    roomManager: IRoomManager;
    outputDeviceId?: string;
}

export const RemoteAudio: React.FC<RemoteAudioProps> = ({
    participantId,
    roomManager,
    outputDeviceId,
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const stream = roomManager.getRemoteStream(participantId);
        if (audioRef.current && stream) {
            audioRef.current.srcObject = stream;
            audioRef.current.play().catch((e) => console.error(`Failed to play audio for ${participantId}:`, e));
        }
    }, [participantId, roomManager]);

    useEffect(() => {
        if (audioRef.current && outputDeviceId) {
            // @ts-ignore: setSinkId is not yet in standard TypeScript definitions for HTMLMediaElement
            if (typeof audioRef.current.setSinkId === 'function') {
                // @ts-ignore
                audioRef.current.setSinkId(outputDeviceId)
                    .catch((e: any) => console.error(`Failed to set sink ID for ${participantId}:`, e));
            }
        }
    }, [outputDeviceId, participantId]);

    return (
        <audio
            ref={audioRef}
            autoPlay
            playsInline
            controls={false}
            style={{ display: 'none' }}
        />
    );
};
