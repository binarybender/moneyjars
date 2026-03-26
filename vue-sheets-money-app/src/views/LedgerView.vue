<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useLedgerStore } from '@/stores/ledger';
import { useAuthStore } from '@/stores/auth';
import { format, subMonths, addMonths, parse } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, Search, Filter } from 'lucide-vue-next';
import BottomNav from '@/components/BottomNav.vue';
import { CURRENCY_SYMBOL } from '@/constants';

const ledgerStore = useLedgerStore();
const authStore = useAuthStore();

const currentMonthDate = ref(new Date());
const monthKey = computed(() => format(currentMonthDate.value, 'MMMM-yyyy'));

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await ledgerStore.fetchBuckets();
    await ledgerStore.fetchTransactions(monthKey.value);
  }
});

const changeMonth = async (delta: number) => {
  if (delta > 0) {
    currentMonthDate.value = addMonths(currentMonthDate.value, 1);
  } else {
    currentMonthDate.value = subMonths(currentMonthDate.value, 1);
  }
  await ledgerStore.fetchTransactions(monthKey.value);
};

const getJarName = (id: string) => {
  return ledgerStore.buckets.find(b => b.bucketId === id)?.name || 'Unknown';
};

const totalSpent = computed(() => {
  return ledgerStore.transactions.reduce((acc, t) => acc + Math.abs(t.amount), 0);
});

const totalBudget = computed(() => {
  return ledgerStore.buckets.reduce((acc, b) => acc + b.monthlyCap, 0);
});

const percentSpent = computed(() => {
  if (totalBudget.value === 0) return 0;
  return Math.min(100, (totalSpent.value / totalBudget.value) * 100);
});
</script>

<template>
  <div class="flex flex-col min-h-screen pb-24 bg-neutral-50">
    <header class="sticky top-0 z-10 p-6 pt-12 bg-neutral-50/80 backdrop-blur-xl border-b border-neutral-200/50 space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold tracking-tight text-neutral-900">Monthly Ledger</h1>
        <div class="flex items-center gap-2 p-1 bg-white border border-neutral-200 rounded-2xl shadow-sm">
          <button @click="changeMonth(-1)" class="p-2 text-neutral-400 hover:text-neutral-900 transition-colors">
            <ChevronLeft class="w-5 h-5" />
          </button>
          <span class="px-2 text-sm font-semibold min-w-[100px] text-center">{{ format(currentMonthDate, 'MMMM yyyy') }}</span>
          <button @click="changeMonth(1)" class="p-2 text-neutral-400 hover:text-neutral-900 transition-colors">
            <ChevronRight class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Summary Card -->
      <div class="p-6 bg-white border border-neutral-200 rounded-3xl shadow-sm space-y-4">
        <div class="flex items-end justify-between">
          <div class="space-y-1">
            <p class="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Total Spent</p>
            <p class="text-3xl font-light text-neutral-900">{{ CURRENCY_SYMBOL }}{{ totalSpent.toFixed(2) }}</p>
          </div>
          <div class="text-right space-y-1">
            <p class="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Remaining</p>
            <p :class="['text-xl font-medium', totalBudget - totalSpent < 0 ? 'text-red-500' : 'text-emerald-500']">
              {{ CURRENCY_SYMBOL }}{{ (totalBudget - totalSpent).toFixed(2) }}
            </p>
          </div>
        </div>
        
        <div class="relative h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            class="absolute inset-y-0 left-0 bg-orange-500 transition-all duration-1000 ease-out"
            :style="{ width: `${percentSpent}%` }"
          ></div>
        </div>
      </div>
    </header>

    <main class="flex-1 p-6 space-y-6">
      <div v-if="ledgerStore.loading" class="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 class="w-8 h-8 text-orange-500 animate-spin" />
        <p class="text-sm text-neutral-400">Fetching transactions...</p>
      </div>

      <div v-else-if="ledgerStore.transactions.length === 0" class="flex flex-col items-center justify-center py-20 space-y-4 text-center">
        <div class="p-4 bg-white border border-neutral-200 rounded-3xl shadow-sm">
          <Search class="w-8 h-8 text-neutral-200" />
        </div>
        <div class="space-y-1">
          <p class="font-medium text-neutral-900">No transactions yet</p>
          <p class="text-sm text-neutral-400">Log your first expense on the Home screen.</p>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="t in ledgerStore.transactions"
          :key="t.entryId"
          class="group p-5 bg-white border border-neutral-200 rounded-3xl shadow-sm hover:border-orange-200 transition-all active:scale-[0.99]"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1 flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-500 rounded-full">
                  {{ getJarName(t.bucketId) }}
                </span>
                <span v-if="t.tags" class="text-[10px] text-neutral-400 truncate">#{{ t.tags }}</span>
              </div>
              <p class="text-sm font-medium text-neutral-900 truncate">{{ t.note || 'No note' }}</p>
              <p class="text-[10px] text-neutral-400">{{ format(parse(t.date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy') }}</p>
            </div>
            <div class="text-right">
              <p class="text-lg font-semibold text-neutral-900">{{ CURRENCY_SYMBOL }}{{ Math.abs(t.amount).toFixed(2) }}</p>
            </div>
          </div>
        </div>
      </div>
    </main>

    <BottomNav />
  </div>
</template>
