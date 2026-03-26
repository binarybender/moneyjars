<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useLedgerStore } from '@/stores/ledger';
import { useAuthStore } from '@/stores/auth';
import { Plus, Loader2, Edit2, Trash2, ChevronRight } from 'lucide-vue-next';
import BottomNav from '@/components/BottomNav.vue';
import { CURRENCY_SYMBOL } from '@/constants';

const ledgerStore = useLedgerStore();
const authStore = useAuthStore();

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await ledgerStore.fetchBuckets();
  }
});

const showAddModal = ref(false);
const editingBucketId = ref<string | null>(null);
const newBucketName = ref('');
const newBucketCap = ref<number>(0);
const isSaving = ref(false);

const openAddModal = () => {
  editingBucketId.value = null;
  newBucketName.value = '';
  newBucketCap.value = 0;
  showAddModal.value = true;
};

const openEditModal = (bucket: any) => {
  editingBucketId.value = bucket.bucketId;
  newBucketName.value = bucket.name;
  newBucketCap.value = bucket.monthlyCap;
  showAddModal.value = true;
};

const handleSaveBucket = async () => {
  if (!newBucketName.value || newBucketCap.value <= 0) return;
  
  isSaving.value = true;
  try {
    if (editingBucketId.value) {
      const bucket = ledgerStore.buckets.find(b => b.bucketId === editingBucketId.value);
      if (bucket) {
        await ledgerStore.updateBucket({
          ...bucket,
          name: newBucketName.value,
          monthlyCap: newBucketCap.value
        });
      }
    } else {
      await ledgerStore.addBucket({
        bucketId: crypto.randomUUID(),
        name: newBucketName.value,
        monthlyCap: newBucketCap.value,
        sortOrder: ledgerStore.buckets.length + 1,
        archived: false
      });
    }
    newBucketName.value = '';
    newBucketCap.value = 0;
    showAddModal.value = false;
  } catch (e) {
    console.error('Failed to save bucket', e);
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col min-h-screen pb-24 bg-neutral-50">
    <header class="p-6 pt-12 space-y-1">
      <h1 class="text-3xl font-bold tracking-tight text-neutral-900">Jars</h1>
      <p class="text-neutral-500">Manage your spending jars.</p>
    </header>

    <main class="flex-1 p-6 space-y-6">
      <div v-if="ledgerStore.loading" class="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 class="w-8 h-8 text-orange-500 animate-spin" />
        <p class="text-sm text-neutral-400">Loading jars...</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="bucket in ledgerStore.buckets"
          :key="bucket.bucketId"
          class="p-6 bg-white border border-neutral-200 rounded-3xl shadow-sm space-y-4"
        >
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <h3 class="text-lg font-bold text-neutral-900">{{ bucket.name }}</h3>
              <p class="text-xs text-neutral-400 uppercase tracking-widest font-bold">Monthly Cap: {{ CURRENCY_SYMBOL }}{{ bucket.monthlyCap }}</p>
            </div>
            <button 
              @click="openEditModal(bucket)"
              class="p-2 text-neutral-300 hover:text-neutral-600 transition-colors"
            >
              <Edit2 class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between text-xs font-medium">
              <span class="text-neutral-500">Spent: {{ CURRENCY_SYMBOL }}{{ ledgerStore.bucketTotals[bucket.bucketId] || 0 }}</span>
              <span :class="[
                'font-bold',
                (ledgerStore.bucketTotals[bucket.bucketId] || 0) > bucket.monthlyCap ? 'text-red-500' : 'text-emerald-500'
              ]">
                {{ Math.max(0, bucket.monthlyCap - (ledgerStore.bucketTotals[bucket.bucketId] || 0)) }} left
              </span>
            </div>
            <div class="relative h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                class="absolute inset-y-0 left-0 bg-orange-500 transition-all duration-1000 ease-out"
                :style="{ width: `${Math.min(100, ((ledgerStore.bucketTotals[bucket.bucketId] || 0) / bucket.monthlyCap) * 100)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <button
          @click="openAddModal"
          class="w-full p-6 flex items-center justify-center gap-3 border-2 border-dashed border-neutral-200 rounded-3xl text-neutral-400 hover:border-orange-200 hover:text-orange-500 transition-all active:scale-[0.98]"
        >
          <Plus class="w-5 h-5" />
          Add New Jar
        </button>
      </div>
    </main>

    <!-- Add Bucket Modal -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div class="w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
        <div class="space-y-1">
          <h2 class="text-xl font-bold text-neutral-900">{{ editingBucketId ? 'Edit Jar' : 'New Jar' }}</h2>
          <p class="text-sm text-neutral-500">{{ editingBucketId ? 'Update your spending category.' : 'Define a new spending category.' }}</p>
        </div>

        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-neutral-400">Name</label>
            <input
              v-model="newBucketName"
              type="text"
              placeholder="e.g. Subscriptions"
              class="w-full px-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-neutral-400">Monthly Cap ({{ CURRENCY_SYMBOL }})</label>
            <input
              v-model="newBucketCap"
              type="number"
              placeholder="0.00"
              class="w-full px-6 py-4 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="showAddModal = false"
            class="flex-1 px-6 py-4 text-neutral-500 font-semibold hover:bg-neutral-50 rounded-2xl transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleSaveBucket"
            :disabled="!newBucketName || newBucketCap <= 0 || isSaving"
            class="flex-1 px-6 py-4 text-white bg-neutral-900 font-semibold rounded-2xl hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <template v-if="isSaving">
              <Loader2 class="w-5 h-5 animate-spin mx-auto" />
            </template>
            <template v-else>
              {{ editingBucketId ? 'Update Jar' : 'Create Jar' }}
            </template>
          </button>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>
