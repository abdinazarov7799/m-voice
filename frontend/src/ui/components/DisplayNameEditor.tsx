import React, { useState, useEffect } from 'react';
import './DisplayNameEditor.css';

interface DisplayNameEditorProps {
    currentDisplayName?: string;
    onUpdate: (newName: string) => void;
}

export const DisplayNameEditor: React.FC<DisplayNameEditorProps> = ({
    currentDisplayName,
    onUpdate,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [nameInput, setNameInput] = useState(currentDisplayName || '');
    const [error, setError] = useState('');

    useEffect(() => {
        setNameInput(currentDisplayName || '');
    }, [currentDisplayName]);

    const handleSave = () => {
        const trimmedName = nameInput.trim();

        // Validation
        if (!trimmedName) {
            setError('Display name cannot be empty');
            return;
        }

        if (trimmedName.length > 50) {
            setError('Display name cannot exceed 50 characters');
            return;
        }

        // Save to localStorage
        localStorage.setItem('m-voice-display-name', trimmedName);

        // Call update handler
        onUpdate(trimmedName);

        setError('');
        setIsEditing(false);
    };

    const handleCancel = () => {
        setNameInput(currentDisplayName || '');
        setError('');
        setIsEditing(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    return (
        <div className="display-name-editor">
            {!isEditing ? (
                <div className="display-name-view">
                    <span className="display-name-label">Your name:</span>
                    <span className="display-name-value">
                        {currentDisplayName || 'Not set'}
                    </span>
                    <button
                        className="edit-button"
                        onClick={() => setIsEditing(true)}
                        title="Edit display name"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M12.854 1.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0zm-8 8L1.207 12.793a1 1 0 0 0 0 1.414l.586.586a1 1 0 0 0 1.414 0L6.854 11.146l-2-2z" />
                            <path d="M13.207 2.207l.086.086a.5.5 0 0 1 0 .707l-9.5 9.5a.5.5 0 0 1-.707 0l-.086-.086a.5.5 0 0 1 0-.707l9.5-9.5a.5.5 0 0 1 .707 0z" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div className="display-name-edit">
                    <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Enter your display name"
                        maxLength={50}
                        autoFocus
                        className={error ? 'error' : ''}
                    />
                    {error && <span className="error-message">{error}</span>}
                    <div className="edit-actions">
                        <button className="save-button" onClick={handleSave}>
                            Save
                        </button>
                        <button className="cancel-button" onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
