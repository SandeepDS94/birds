import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Helper to execute fetch requests with Supabase JWT Bearer token.
 */
async function apiRequest(endpoint, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({
    success: false,
    message: `Server returned ${response.status}: ${response.statusText}`,
  }));

  if (!response.ok) {
    throw new Error(json.message || `Request failed with status ${response.status}`);
  }

  return json;
}

export const api = {
  // System Health
  async checkHealth() {
    return apiRequest('/api/health');
  },

  // Audio Identification
  async identifyAudio(file) {
    const formData = new FormData();
    formData.append('file', file);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/identify`, {
      method: 'POST',
      body: formData,
      headers,
    });

    const json = await response.json().catch(() => ({
      success: false,
      message: 'Failed to parse server response.',
    }));

    if (!response.ok) {
      throw new Error(json.message || 'Identification failed.');
    }

    return json;
  },

  // Bird Catalog
  async getBirds() {
    return apiRequest('/api/birds');
  },

  async getBirdByScientificName(scientificName) {
    return apiRequest(`/api/birds/${encodeURIComponent(scientificName)}`);
  },

  // Recording History
  async getHistory(page = 1, limit = 20) {
    return apiRequest(`/api/history?page=${page}&limit=${limit}`);
  },

  async getHistoryItem(id) {
    return apiRequest(`/api/history/${id}`);
  },

  async deleteHistoryItem(id) {
    return apiRequest(`/api/history/${id}`, {
      method: 'DELETE',
    });
  },

  // Analytics & Statistics
  async getStatistics() {
    return apiRequest('/api/statistics');
  },

  // AI Bird Image Generation
  async generateBirdImage({ commonName, scientificName, customPrompt = '' }) {
    return apiRequest('/api/birds/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        common_name: commonName,
        scientific_name: scientificName,
        custom_prompt: customPrompt,
      }),
    });
  },
};
