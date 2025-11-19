/**
 * UI Component: Audio Level Indicator
 * 
 * Displays a visual indicator of audio input level (0-1).
 * Shows a horizontal bar that fills based on the audio level.
 */
import React from 'react';
import './AudioLevelIndicator.css';

interface AudioLevelIndicatorProps {
  level: number; // 0-1
}

export const AudioLevelIndicator: React.FC<AudioLevelIndicatorProps> = ({ level }) => {
  // Clamp level between 0 and 1
  const clampedLevel = Math.max(0, Math.min(1, level));
  const percentage = Math.round(clampedLevel * 100);

  // Determine color based on level
  const getColor = (): string => {
    if (percentage < 20) return '#6b7280'; // Gray (very quiet)
    if (percentage < 50) return '#10b981'; // Green (good)
    if (percentage < 80) return '#f59e0b'; // Orange (loud)
    return '#ef4444'; // Red (very loud)
  };

  return (
    <div className="audio-level-indicator">
      <div className="audio-level-label">
        <span>Audio Level</span>
        <span className="audio-level-value">{percentage}%</span>
      </div>
      <div className="audio-level-bar">
        <div
          className="audio-level-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: getColor(),
          }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Audio level: ${percentage}%`}
        />
      </div>
    </div>
  );
};

