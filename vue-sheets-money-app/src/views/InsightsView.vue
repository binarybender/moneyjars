<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useLedgerStore } from '@/stores/ledger';
import { useAuthStore } from '@/stores/auth';
import { Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js';
import { format } from 'date-fns';
import { Loader2, TrendingUp, AlertCircle } from 'lucide-vue-next';
import BottomNav from '@/components/BottomNav.vue';
import { CURRENCY_SYMBOL } from '@/constants';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

const ledgerStore = useLedgerStore();
const authStore = useAuthStore();

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await ledgerStore.fetchBuckets();
    await ledgerStore.fetchTransactions(ledgerStore.currentMonth);
  }
});

const chartData = computed(() => {
  const labels = ledgerStore.buckets.map(b => b.name);
  const data = ledgerStore.buckets.map(b => ledgerStore.bucketTotals[b.bucketId] || 0);
  
  return {
    labels,
    datasets: [
      {
        backgroundColor: [
          '#f97316', // orange-500
          '#0ea5e9', // sky-500
          '#10b981', // emerald-500
          '#8b5cf6', // violet-500
          '#f43f5e', // rose-500
          '#eab308', // yellow-500
          '#6366f1', // indigo-500
          '#d946ef', // fuchsia-500
        ],
        data,
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          family: 'Inter',
          size: 11,
        },
      },
    },
    tooltip: {
      backgroundColor: '#171717',
      padding: 12,
      titleFont: { size: 14, weight: 'bold' as const },
      bodyFont: { size: 13 },
      cornerRadius: 12,
      displayColors: false,
    },
  },
};

const overBudgetJars = computed(() => {
  return ledgerStore.buckets.filter(b => (ledgerStore.bucketTotals[b.bucketId] || 0) > b.monthlyCap);
});
</script>

<template>
  <div class="flex flex-col min-h-screen pb-24 bg-neutral-50">
    <header class="p-6 pt-12 space-y-1">
      <h1 class="text-3xl font-bold tracking-tight text-neutral-900">Insights</h1>
      <p class="text-neutral-500">Analyze your spending habits.</p>
    </header>

    <main class="flex-1 p-6 space-y-8">
      <div v-if="ledgerStore.loading" class="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 class="w-8 h-8 text-orange-500 animate-spin" />
        <p class="text-sm text-neutral-400">Analyzing data...</p>
      </div>

      <div v-else-if="ledgerStore.transactions.length === 0" class="flex flex-col items-center justify-center py-20 space-y-4 text-center">
        <div class="p-4 bg-white border border-neutral-200 rounded-3xl shadow-sm">
          <TrendingUp class="w-8 h-8 text-neutral-200" />
        </div>
        <div class="space-y-1">
          <p class="font-medium text-neutral-900">No data for this month</p>
          <p class="text-sm text-neutral-400">Add transactions to see insights.</p>
        </div>
      </div>

      <div v-else class="space-y-8">
        <!-- Chart Card -->
        <div class="p-8 bg-white border border-neutral-200 rounded-3xl shadow-sm space-y-6">
          <div class="space-y-1">
            <h2 class="text-lg font-bold text-neutral-900">Spending by Jar</h2>
            <p class="text-xs text-neutral-400 uppercase tracking-widest font-bold">{{ ledgerStore.currentMonth }}</p>
          </div>
          <div class="h-64 relative">
            <Pie :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Over Budget Alerts -->
        <div v-if="overBudgetJars.length > 0" class="space-y-4">
          <h3 class="text-xs font-bold uppercase tracking-widest text-neutral-400">Budget Alerts</h3>
          <div
            v-for="bucket in overBudgetJars"
            :key="bucket.bucketId"
            class="flex items-center gap-4 p-5 bg-red-50 border border-red-100 rounded-3xl text-red-700"
          >
            <div class="p-2 bg-white rounded-xl shadow-sm">
              <AlertCircle class="w-5 h-5 text-red-500" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold truncate">{{ bucket.name }} is over budget</p>
              <p class="text-xs opacity-70">Exceeded by {{ CURRENCY_SYMBOL }}{{ ((ledgerStore.bucketTotals[bucket.bucketId] || 0) - bucket.monthlyCap).toFixed(2) }}</p>
            </div>
          </div>
        </div>

        <!-- Top Categories List -->
        <div class="space-y-4">
          <h3 class="text-xs font-bold uppercase tracking-widest text-neutral-400">Category Breakdown</h3>
          <div class="space-y-3">
            <div
              v-for="bucket in [...ledgerStore.buckets].sort((a, b) => (ledgerStore.bucketTotals[b.bucketId] || 0) - (ledgerStore.bucketTotals[a.bucketId] || 0))"
              :key="bucket.bucketId"
              class="flex items-center justify-between p-5 bg-white border border-neutral-200 rounded-3xl shadow-sm"
            >
              <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full bg-orange-500"></div>
                <span class="text-sm font-medium text-neutral-900">{{ bucket.name }}</span>
              </div>
              <span class="text-sm font-bold text-neutral-900">{{ CURRENCY_SYMBOL }}{{ (ledgerStore.bucketTotals[bucket.bucketId] || 0).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <BottomNav />
  </div>
</template>
