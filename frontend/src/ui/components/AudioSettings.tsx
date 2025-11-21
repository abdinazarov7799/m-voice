import React, { useState } from 'react';
import './AudioSettings.css';

interface AudioSettingsProps {
    onNoiseSuppressionChange: (enabled: boolean) => void;
    onMicrophoneGainChange: (gain: number) => void;
}

export const AudioSettings: React.FC<AudioSettingsProps> = ({
    onNoiseSuppressionChange,
    onMicrophoneGainChange,
}) => {
    const [noiseSuppression, setNoiseSuppression] = useState<boolean>(() => {
        const stored = localStorage.getItem('m-voice-noise-suppression');
        return stored !== null ? stored === 'true' : true; // Default ON
    });

    const [microphoneGain, setMicrophoneGain] = useState<number>(() => {
        const stored = localStorage.getItem('m-voice-microphone-gain');
        return stored !== null ? parseFloat(stored) : 1.0; // Default 100%
    });

    const handleNoiseSuppressionToggle = () => {
        const newValue = !noiseSuppression;
        setNoiseSuppression(newValue);
        localStorage.setItem('m-voice-noise-suppression', newValue.toString());
        onNoiseSuppressionChange(newValue);
    };

    const handleGainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newGain = parseFloat(e.target.value);
        setMicrophoneGain(newGain);
        localStorage.setItem('m-voice-microphone-gain', newGain.toString());
        onMicrophoneGainChange(newGain);
    };

    return (
        <div className="audio-settings">
            <h3 className="audio-settings-title">Audio Settings</h3>

            {/* Noise Suppression Toggle */}
            <div className="setting-item">
                <div className="setting-header">
                    <label htmlFor="noise-suppression">
                        <span className="setting-icon">🎯</span>
                        Noise Suppression
                    </label>
                    <span className="setting-description">
                        Reduces background noise from your microphone
                    </span>
                </div>
                <label className="toggle-switch">
                    <input
                        id="noise-suppression"
                        type="checkbox"
                        checked={noiseSuppression}
                        onChange={handleNoiseSuppressionToggle}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>

            {/* Microphone Gain Control */}
            <div className="setting-item">
                <div className="setting-header">
                    <label htmlFor="microphone-gain">
                        <span className="setting-icon">🎚️</span>
                        Microphone Volume
                    </label>
                    <span className="setting-value">{Math.round(microphoneGain * 100)}%</span>
                </div>
                <input
                    id="microphone-gain"
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={microphoneGain}
                    onChange={handleGainChange}
                    className="gain-slider"
                />
                <div className="slider-labels">
                    <span>50%</span>
                    <span>100%</span>
                    <span>200%</span>
                </div>
            </div>

            {/* Info Box */}
            <div className="settings-info">
                <span className="info-icon">💡</span>
                <span className="info-text">
                    Changes will apply when you restart your microphone or rejoin the room
                </span>
            </div>
        </div>
    );
};
