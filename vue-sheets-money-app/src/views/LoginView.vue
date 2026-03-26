<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { LogIn, AlertTriangle, ExternalLink } from 'lucide-vue-next';

const authStore = useAuthStore();

const handleLogin = () => {
  if (!authStore.isConfigured) {
    return;
  }
  authStore.login();
};
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-6 bg-neutral-50">
    <div class="w-full max-w-md space-y-8 text-center">
      <div class="space-y-2">
        <h1 class="text-4xl font-bold tracking-tight text-neutral-900">Vue Sheets Money</h1>
        <p class="text-neutral-500">Your personal finance, powered by Google Sheets.</p>
      </div>

      <div class="p-8 bg-white border border-neutral-200 rounded-3xl shadow-sm space-y-6">
        <div class="flex justify-center">
          <div class="p-4 bg-orange-50 rounded-2xl">
            <LogIn class="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div v-if="!authStore.isConfigured" class="p-6 bg-red-50 border border-red-100 rounded-2xl space-y-4 text-left animate-in fade-in slide-in-from-top-2 duration-500">
          <div class="flex items-center gap-3 text-red-600">
            <AlertTriangle class="w-5 h-5 shrink-0" />
            <span class="font-bold text-sm">Configuration Required</span>
          </div>
          <p class="text-xs text-red-700 leading-relaxed">
            The Google Client ID is missing. To fix this, add <code class="bg-red-100 px-1 rounded font-mono">VITE_GOOGLE_CLIENT_ID</code> to your environment variables in AI Studio.
          </p>
          <a 
            href="https://console.cloud.google.com/apis/credentials" 
            target="_blank"
            class="inline-flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
          >
            Get Client ID from Google Console
            <ExternalLink class="w-3 h-3" />
          </a>
        </div>

        <div v-else class="space-y-4">
          <p class="text-sm text-neutral-600">
            Sign in with your Google account to create or access your finance spreadsheet.
          </p>
          <button
            @click="handleLogin"
            class="w-full flex items-center justify-center gap-3 px-6 py-4 text-white bg-neutral-900 rounded-2xl font-medium hover:bg-neutral-800 transition-colors active:scale-[0.98]"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>
        </div>
      </div>

      <p class="text-xs text-neutral-400">
        We only request access to your spreadsheets and basic profile info.
      </p>
    </div>
  </div>
</template>
