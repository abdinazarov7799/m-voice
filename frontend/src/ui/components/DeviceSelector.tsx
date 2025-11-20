import React, { useEffect, useState } from 'react';
import './DeviceSelector.css';

interface DeviceSelectorProps {
    onInputDeviceChange: (deviceId: string) => void;
    onOutputDeviceChange: (deviceId: string) => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
    onInputDeviceChange,
    onOutputDeviceChange,
}) => {
    const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
    const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
    const [selectedInput, setSelectedInput] = useState<string>('');
    const [selectedOutput, setSelectedOutput] = useState<string>('');

    useEffect(() => {
        const getDevices = async () => {
            try {
                // Request permission first to get device labels
                await navigator.mediaDevices.getUserMedia({ audio: true });

                const devices = await navigator.mediaDevices.enumerateDevices();

                const inputs = devices.filter((d) => d.kind === 'audioinput');
                const outputs = devices.filter((d) => d.kind === 'audiooutput');

                setAudioInputs(inputs);
                setAudioOutputs(outputs);

                if (inputs.length > 0 && inputs[0]) {
                    setSelectedInput(inputs[0].deviceId);
                }
                if (outputs.length > 0 && outputs[0]) {
                    setSelectedOutput(outputs[0].deviceId);
                }
            } catch (error) {
                console.error('Error enumerating devices:', error);
            }
        };

        getDevices();

        navigator.mediaDevices.addEventListener('devicechange', getDevices);
        return () => {
            navigator.mediaDevices.removeEventListener('devicechange', getDevices);
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const deviceId = e.target.value;
        setSelectedInput(deviceId);
        onInputDeviceChange(deviceId);
    };

    const handleOutputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const deviceId = e.target.value;
        setSelectedOutput(deviceId);
        onOutputDeviceChange(deviceId);
    };

    return (
        <div className="device-selector">
            <div className="device-group">
                <label htmlFor="audio-input">Microphone</label>
                <select
                    id="audio-input"
                    value={selectedInput}
                    onChange={handleInputChange}
                    className="device-select"
                >
                    {audioInputs.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                        </option>
                    ))}
                </select>
            </div>

            {audioOutputs.length > 0 && (
                <div className="device-group">
                    <label htmlFor="audio-output">Speaker</label>
                    <select
                        id="audio-output"
                        value={selectedOutput}
                        onChange={handleOutputChange}
                        className="device-select"
                    >
                        {audioOutputs.map((device) => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Speaker ${device.deviceId.slice(0, 5)}...`}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};
