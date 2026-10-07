import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import IdentificationResult from '../components/IdentificationResult';

describe('IdentificationResult Component', () => {
  const mockResult = {
    status: 'identified',
    bird_name: 'Indian Peafowl',
    scientific_name: 'Pavo cristatus',
    confidence: 0.85,
    recording_duration: 12.5,
    audio_url: 'https://example.com/audio.wav',
    spectrogram: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    top_predictions: [
      { common_name: 'Indian Peafowl', scientific_name: 'Pavo cristatus', confidence: 0.85 },
      { common_name: 'Jungle Nightjar', scientific_name: 'Caprimulgus indicus', confidence: 0.22 },
    ],
    bird_info: {
      common_name: 'Indian Peafowl',
      scientific_name: 'Pavo cristatus',
      family: 'Phasianidae',
      order: 'Galliformes',
      description: 'A majestic pheasant.',
      habitat: 'Deciduous forest',
      diet: 'Omnivorous',
      conservation_status: 'Least Concern',
      interesting_facts: ['National Bird of India'],
      in_database: true,
      image_url: 'https://example.com/peacock.jpg',
    },
    message: 'Identified successfully',
  };

  it('renders identified bird headline, confidence, and taxonomy', () => {
    render(<IdentificationResult result={mockResult} onReset={() => {}} />);
    expect(screen.getByText(/Bird Identified/i)).toBeInTheDocument();
    expect(screen.getAllByText('Indian Peafowl')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Pavo cristatus')[0]).toBeInTheDocument();
    expect(screen.getByText(/85% Confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/Family: Phasianidae/i)).toBeInTheDocument();
    expect(screen.getByText(/Identify Another Sound/i)).toBeInTheDocument();
  });
});
