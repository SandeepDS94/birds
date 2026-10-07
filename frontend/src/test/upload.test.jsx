import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AudioUploader from '../components/AudioUploader';

describe('AudioUploader Component', () => {
  it('renders drag-and-drop file upload zone', () => {
    render(<AudioUploader selectedFile={null} onFileSelected={() => {}} />);
    expect(screen.getByText(/Drag & Drop audio file here/i)).toBeInTheDocument();
    expect(screen.getByText(/Supported formats: WAV, MP3, OGG, FLAC, M4A, WebM/i)).toBeInTheDocument();
  });

  it('displays selected file details when file is provided', () => {
    const file = new File(['dummy audio content'], 'peacock_call.wav', { type: 'audio/wav' });
    render(<AudioUploader selectedFile={file} onFileSelected={() => {}} />);
    expect(screen.getByText('peacock_call.wav')).toBeInTheDocument();
    expect(screen.getByText(/Ready for AI identification/i)).toBeInTheDocument();
  });
});
