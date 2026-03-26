<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useLedgerStore } from '@/stores/ledger';
import { useAuthStore } from '@/stores/auth';
import { Plus, Check, ChevronDown, Tag, StickyNote, Calendar as CalendarIcon, Loader2 } from 'lucide-vue-next';
import { format, parse } from 'date-fns';
import BottomNav from '@/components/BottomNav.vue';
import { CURRENCY_SYMBOL } from '@/constants';

const ledgerStore = useLedgerStore();
const authStore = useAuthStore();

const amount = ref<string>('');
const selectedBucketId = ref<string>('');
const tags = ref<string>('');
const note = ref<string>('');
const date = ref<string>(format(new Date(), 'yyyy-MM-dd'));
const showAdvanced = ref(false);
const isSaving = ref(false);
const success = ref(false);

onMounted(async () => {
  if (authStore.isAuthenticated) {
    if (!authStore.spreadsheetId) {
      await ledgerStore.bootstrapSpreadsheet();
    }
    await ledgerStore.fetchBuckets();
    await ledgerStore.fetchTransactions(ledgerStore.currentMonth);
    if (ledgerStore.buckets.length > 0) {
      selectedBucketId.value = ledgerStore.buckets[0].bucketId;
    }
  }
});

const handleAdd = async () => {
  if (!amount.value || !selectedBucketId.value) return;
  
  isSaving.value = true;
  try {
    await ledgerStore.addTransaction({
      amount: -Math.abs(Number(amount.value)), // Default to outflow
      bucketId: selectedBucketId.value,
      tags: tags.value,
      note: note.value,
      date: date.value,
    });
    
    // Reset form
    amount.value = '';
    tags.value = '';
    note.value = '';
    success.value = true;
    setTimeout(() => {
      success.value = false;
    }, 2000);
  } catch (e) {
    console.error('Failed to add transaction', e);
  } finally {
    isSaving.value = false;
  }
};

const sortedJars = computed(() => {
  return [...ledgerStore.buckets].sort((a, b) => a.sortOrder - b.sortOrder);
});

const suggestedTags = computed(() => {
  if (!tags.value) return [];
  const currentTags = tags.value.split(',').map(t => t.trim().toLowerCase());
  const lastTag = currentTags[currentTags.length - 1];
  if (!lastTag) return [];
  
  return ledgerStore.allTags
    .filter(t => t.toLowerCase().includes(lastTag) && !currentTags.includes(t.toLowerCase()))
    .slice(0, 5);
});

const addSuggestedTag = (tag: string) => {
  const currentTags = tags.value.split(',').map(t => t.trim());
  currentTags[currentTags.length - 1] = tag;
  tags.value = currentTags.join(', ') + ', ';
};
</script>

<template>
  <div class="flex flex-col min-h-screen pb-64">
    <header class="p-6 pt-12 space-y-1">
      <h1 class="text-3xl font-bold tracking-tight text-neutral-900">Quick Add</h1>
      <p class="text-neutral-500">Log a new expense quickly.</p>
    </header>

    <main class="flex-1 px-6 space-y-8">
      <!-- Amount Input -->
      <div class="space-y-2">
        <label class="text-xs font-semibold uppercase tracking-wider text-neutral-400">Amount</label>
        <div class="relative">
          <span class="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-light text-neutral-300">{{ CURRENCY_SYMBOL }}</span>
          <input
            v-model="amount"
            type="number"
            inputmode="decimal"
            placeholder="0.00"
            class="w-full pl-12 pr-6 py-8 text-6xl font-light bg-white border border-neutral-200 rounded-3xl shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-100"
            autofocus
          />
        </div>
      </div>

      <!-- Jar Selection -->
      <div class="space-y-4">
        <label class="text-xs font-semibold uppercase tracking-wider text-neutral-400">Jar</label>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="bucket in sortedJars"
            :key="bucket.bucketId"
            @click="selectedBucketId = bucket.bucketId"
            :class="[
              'p-4 text-left rounded-2xl border transition-all active:scale-[0.98]',
              selectedBucketId === bucket.bucketId
                ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm'
                : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
            ]"
          >
            <div class="text-sm font-medium truncate">{{ bucket.name }}</div>
            <div class="text-[10px] opacity-60 uppercase tracking-tighter">
              {{ CURRENCY_SYMBOL }}{{ ledgerStore.bucketTotals[bucket.bucketId] || 0 }} / {{ CURRENCY_SYMBOL }}{{ bucket.monthlyCap }}
            </div>
          </button>
        </div>
      </div>

      <!-- Context Fields (Always Visible) -->
      <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div class="grid grid-cols-1 gap-4">
          <div class="space-y-2">
            <div class="relative group">
              <Tag class="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 group-focus-within:text-orange-500 transition-colors" />
              <input
                v-model="tags"
                type="text"
                placeholder="Add tags (coffee, lunch...)"
                class="w-full pl-12 pr-6 py-4 bg-white border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm"
              />
            </div>
            
            <!-- Tag Suggestions -->
            <div v-if="suggestedTags.length > 0" class="flex flex-wrap gap-2 px-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <button
                v-for="tag in suggestedTags"
                :key="tag"
                @click="addSuggestedTag(tag)"
                class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-orange-50 text-orange-600 border border-orange-100 rounded-full hover:bg-orange-100 transition-colors"
              >
                + {{ tag }}
              </button>
            </div>
          </div>

          <div class="relative group">
            <StickyNote class="absolute left-5 top-5 w-4 h-4 text-neutral-300 group-focus-within:text-orange-500 transition-colors" />
            <textarea
              v-model="note"
              placeholder="What was this for?"
              rows="2"
              class="w-full pl-12 pr-6 py-4 bg-white border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm resize-none"
            ></textarea>
          </div>
        </div>

        <!-- Subtle Date Toggle -->
        <div class="flex justify-center">
          <button
            @click="showAdvanced = !showAdvanced"
            class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-300 hover:text-neutral-500 transition-colors"
          >
            <CalendarIcon class="w-3 h-3" />
            {{ showAdvanced ? 'Set to Today' : format(parse(date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy') }}
          </button>
        </div>

        <div v-if="showAdvanced" class="animate-in fade-in zoom-in-95 duration-300">
          <input
            v-model="date"
            type="date"
            class="w-full px-6 py-4 bg-white border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm"
          />
        </div>
      </div>
    </main>

    <!-- Save Button -->
    <div class="fixed bottom-24 left-0 right-0 p-6 pointer-events-none">
      <button
        @click="handleAdd"
        :disabled="!amount || !selectedBucketId || isSaving"
        class="w-full max-w-md mx-auto flex items-center justify-center gap-3 px-8 py-5 text-white bg-neutral-900 rounded-3xl font-semibold shadow-xl shadow-neutral-200 hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
      >
        <template v-if="isSaving">
          <Loader2 class="w-6 h-6 animate-spin" />
          Saving to Sheets...
        </template>
        <template v-else-if="success">
          <Check class="w-6 h-6" />
          Saved!
        </template>
        <template v-else>
          <Plus class="w-6 h-6" />
          Save Transaction
        </template>
      </button>
    </div>

    <BottomNav />
  </div>
</template>
