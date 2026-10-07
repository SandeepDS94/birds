import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AudioRecorder from '../components/AudioRecorder';

describe('AudioRecorder Component', () => {
  it('renders start recording button in idle state', () => {
    render(<AudioRecorder recordedBlob={null} onRecordingComplete={() => {}} onReset={() => {}} />);
    expect(screen.getByRole('button', { name: /Start Recording/i })).toBeInTheDocument();
  });
});
