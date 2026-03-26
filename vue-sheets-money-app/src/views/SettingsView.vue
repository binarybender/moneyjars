<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useLedgerStore } from '@/stores/ledger';
import { LogOut, ExternalLink, Shield, Info, ChevronRight, User, Database } from 'lucide-vue-next';
import BottomNav from '@/components/BottomNav.vue';

const authStore = useAuthStore();
const ledgerStore = useLedgerStore();

const handleLogout = () => {
  authStore.logout();
};

const openSheet = () => {
  if (authStore.spreadsheetId) {
    window.open(`https://docs.google.com/spreadsheets/d/${authStore.spreadsheetId}`, '_blank');
  }
};
</script>

<template>
  <div class="flex flex-col min-h-screen pb-24 bg-neutral-50">
    <header class="p-6 pt-12 space-y-1">
      <h1 class="text-3xl font-bold tracking-tight text-neutral-900">Settings</h1>
      <p class="text-neutral-500">Manage your account and data.</p>
    </header>

    <main class="flex-1 p-6 space-y-8">
      <!-- User Profile Card -->
      <div class="p-8 bg-white border border-neutral-200 rounded-3xl shadow-sm space-y-6">
        <div class="flex items-center gap-4">
          <img v-if="authStore.user?.picture" :src="authStore.user.picture" class="w-16 h-16 rounded-2xl shadow-sm border border-neutral-100" />
          <div v-else class="w-16 h-16 bg-orange-100 flex items-center justify-center rounded-2xl">
            <User class="w-8 h-8 text-orange-500" />
          </div>
          <div class="space-y-1">
            <h2 class="text-xl font-bold text-neutral-900">{{ authStore.user?.name || 'User' }}</h2>
            <p class="text-sm text-neutral-400">{{ authStore.user?.email || 'No email' }}</p>
          </div>
        </div>
        <button
          @click="handleLogout"
          class="w-full flex items-center justify-center gap-2 px-6 py-4 text-red-500 bg-red-50 font-bold rounded-2xl hover:bg-red-100 transition-colors active:scale-[0.98]"
        >
          <LogOut class="w-5 h-5" />
          Sign Out
        </button>
      </div>

      <!-- Data Settings -->
      <div class="space-y-4">
        <h3 class="text-xs font-bold uppercase tracking-widest text-neutral-400">Data Management</h3>
        <div class="p-2 bg-white border border-neutral-200 rounded-3xl shadow-sm space-y-1">
          <button
            @click="openSheet"
            class="w-full flex items-center justify-between p-4 hover:bg-neutral-50 rounded-2xl transition-colors group"
          >
            <div class="flex items-center gap-4">
              <div class="p-2 bg-emerald-50 rounded-xl">
                <Database class="w-5 h-5 text-emerald-500" />
              </div>
              <div class="text-left">
                <p class="text-sm font-bold text-neutral-900">Open in Google Sheets</p>
                <p class="text-xs text-neutral-400">View your raw data directly.</p>
              </div>
            </div>
            <ExternalLink class="w-4 h-4 text-neutral-300 group-hover:text-neutral-900 transition-colors" />
          </button>
          
          <div class="h-px bg-neutral-100 mx-4"></div>

          <div class="w-full flex items-center justify-between p-4">
            <div class="flex items-center gap-4">
              <div class="p-2 bg-blue-50 rounded-xl">
                <Shield class="w-5 h-5 text-blue-500" />
              </div>
              <div class="text-left">
                <p class="text-sm font-bold text-neutral-900">Privacy & Security</p>
                <p class="text-xs text-neutral-400">Your data stays in your Google Drive.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- App Info -->
      <div class="space-y-4">
        <h3 class="text-xs font-bold uppercase tracking-widest text-neutral-400">App Info</h3>
        <div class="p-6 bg-white border border-neutral-200 rounded-3xl shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-neutral-50 rounded-xl">
                <Info class="w-5 h-5 text-neutral-400" />
              </div>
              <span class="text-sm font-medium text-neutral-900">Version</span>
            </div>
            <span class="text-sm font-bold text-neutral-400">1.0.0</span>
          </div>
        </div>
      </div>

      <p class="text-center text-xs text-neutral-300 py-4">
        Built with Vue 3 & Google Sheets API
      </p>
    </main>

    <BottomNav />
  </div>
</template>
