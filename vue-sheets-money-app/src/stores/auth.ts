import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import router from '@/router';

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('google_access_token'));
  const expiresAt = ref<number | null>(Number(localStorage.getItem('google_token_expires_at')) || null);
  const user = ref<any>(JSON.parse(localStorage.getItem('google_user') || 'null'));
  const spreadsheetId = ref<string | null>(localStorage.getItem('spreadsheet_id'));

  const isAuthenticated = computed(() => {
    if (!accessToken.value || !expiresAt.value) return false;
    return Date.now() < expiresAt.value;
  });

  function setToken(token: string, expiresIn: number) {
    accessToken.value = token;
    expiresAt.value = Date.now() + expiresIn * 1000;
    localStorage.setItem('google_access_token', token);
    localStorage.setItem('google_token_expires_at', expiresAt.value.toString());
  }

  function setUser(userData: any) {
    user.value = userData;
    localStorage.setItem('google_user', JSON.stringify(userData));
  }

  function setSpreadsheetId(id: string) {
    spreadsheetId.value = id;
    localStorage.setItem('spreadsheet_id', id);
  }

  function logout() {
    accessToken.value = null;
    expiresAt.value = null;
    user.value = null;
    spreadsheetId.value = null;
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expires_at');
    localStorage.removeItem('google_user');
    localStorage.removeItem('spreadsheet_id');
    router.push({ name: 'login' });
  }

  let tokenClient: any = null;

  const isConfigured = computed(() => {
    return !!(import.meta.env.VITE_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID);
  });

  function initGIS() {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID is not set. Please add it to your environment variables.');
      return;
    }

    // @ts-ignore
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile',
      callback: (response: any) => {
        if (response.error) {
          console.error('GIS Error:', response.error);
          return;
        }
        setToken(response.access_token, response.expires_in);
        fetchUserInfo();
        router.push({ name: 'home' });
      },
    });
  }

  async function fetchUserInfo() {
    if (!accessToken.value) return;
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken.value}` },
      });
      const data = await res.json();
      setUser(data);
    } catch (e) {
      console.error('Failed to fetch user info', e);
    }
  }

  function login() {
    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      initGIS();
      tokenClient?.requestAccessToken();
    }
  }

  return {
    accessToken,
    user,
    spreadsheetId,
    isAuthenticated,
    isConfigured,
    setToken,
    setSpreadsheetId,
    logout,
    login,
    initGIS,
  };
});
