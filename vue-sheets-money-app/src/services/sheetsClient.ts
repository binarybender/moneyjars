import { useAuthStore } from '@/stores/auth';

const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_BASE_URL = 'https://www.googleapis.com/drive/v3/files';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const authStore = useAuthStore();
  if (!authStore.accessToken) throw new Error('No access token');

  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${authStore.accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) {
    authStore.logout();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  return res.json();
}

export const sheetsClient = {
  async findSpreadsheet(title: string) {
    const q = `name = '${title}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
    const res = await fetchWithAuth(`${DRIVE_BASE_URL}?q=${encodeURIComponent(q)}&fields=files(id, name)`);
    return res.files && res.files.length > 0 ? res.files[0] : null;
  },

  async createSpreadsheet(title: string) {
    return fetchWithAuth(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        properties: { title },
        sheets: [
          { properties: { title: '_Meta' } },
          { properties: { title: 'Buckets' } },
        ],
      }),
    });
  },

  async getSpreadsheet(spreadsheetId: string) {
    return fetchWithAuth(`${BASE_URL}/${spreadsheetId}`);
  },

  async batchUpdate(spreadsheetId: string, requests: any[]) {
    return fetchWithAuth(`${BASE_URL}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  },

  async getValues(spreadsheetId: string, range: string) {
    return fetchWithAuth(`${BASE_URL}/${spreadsheetId}/values/${range}`);
  },

  async updateValues(spreadsheetId: string, range: string, values: any[][]) {
    return fetchWithAuth(`${BASE_URL}/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({ values }),
    });
  },

  async appendValues(spreadsheetId: string, range: string, values: any[][]) {
    return fetchWithAuth(`${BASE_URL}/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      body: JSON.stringify({ values }),
    });
  },

  async batchGetValues(spreadsheetId: string, ranges: string[]) {
    const params = new URLSearchParams();
    ranges.forEach(r => params.append('ranges', r));
    return fetchWithAuth(`${BASE_URL}/${spreadsheetId}/values:batchGet?${params.toString()}`);
  }
};
