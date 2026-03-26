import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth';
import { sheetsClient } from '@/services/sheetsClient';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

export interface Transaction {
  entryId: string;
  date: string;
  amount: number;
  bucketId: string;
  tags: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bucket {
  bucketId: string;
  name: string;
  monthlyCap: number;
  sortOrder: number;
  archived: boolean;
}

export const useLedgerStore = defineStore('ledger', () => {
  const authStore = useAuthStore();
  const transactions = ref<Transaction[]>([]);
  const buckets = ref<Bucket[]>([]);
  const loading = ref(false);
  const currentMonth = ref(format(new Date(), 'MMMM-yyyy'));

  const currentMonthTransactions = computed(() => transactions.value);

  const allTags = computed(() => {
    const tagSet = new Set<string>();
    transactions.value.forEach(t => {
      if (t.tags) {
        t.tags.split(',').forEach(tag => {
          const trimmed = tag.trim();
          if (trimmed) tagSet.add(trimmed);
        });
      }
    });
    return Array.from(tagSet).sort();
  });

  const bucketTotals = computed(() => {
    const totals: Record<string, number> = {};
    transactions.value.forEach(t => {
      totals[t.bucketId] = (totals[t.bucketId] || 0) + Math.abs(t.amount);
    });
    return totals;
  });

  async function bootstrapSpreadsheet() {
    if (authStore.spreadsheetId) return;

    loading.value = true;
    try {
      const title = 'Jars Money App';
      const oldTitle = 'Vue Sheets Money App';
      let existing = await sheetsClient.findSpreadsheet(title);
      
      if (!existing) {
        existing = await sheetsClient.findSpreadsheet(oldTitle);
      }
      
      if (existing) {
        authStore.setSpreadsheetId(existing.id);
        return;
      }

      const res = await sheetsClient.createSpreadsheet(title);
      authStore.setSpreadsheetId(res.spreadsheetId);

      // Initialize Buckets and _Meta
      await sheetsClient.updateValues(res.spreadsheetId, 'Buckets!A1:E1', [['bucketId', 'name', 'monthlyCap', 'sortOrder', 'archived']]);
      await sheetsClient.updateValues(res.spreadsheetId, '_Meta!A1:B2', [['key', 'value'], ['version', '1.0.0']]);
      
      // Add some default buckets
      await addBucket({ bucketId: '1', name: 'Groceries', monthlyCap: 15000, sortOrder: 1, archived: false });
      await addBucket({ bucketId: '2', name: 'Dining', monthlyCap: 5000, sortOrder: 2, archived: false });
      await addBucket({ bucketId: '3', name: 'Transport', monthlyCap: 3000, sortOrder: 3, archived: false });
      await addBucket({ bucketId: '4', name: 'Rent', monthlyCap: 25000, sortOrder: 4, archived: false });

    } catch (e) {
      console.error('Failed to bootstrap spreadsheet', e);
    } finally {
      loading.value = false;
    }
  }

  async function fetchBuckets() {
    if (!authStore.spreadsheetId) return;
    try {
      const res = await sheetsClient.getValues(authStore.spreadsheetId, 'Buckets!A2:E100');
      if (res.values) {
        buckets.value = res.values.map((row: any[]) => ({
          bucketId: row[0],
          name: row[1],
          monthlyCap: Number(row[2]),
          sortOrder: Number(row[3]),
          archived: row[4] === 'TRUE',
        }));
      }
    } catch (e) {
      console.error('Failed to fetch buckets', e);
    }
  }

  async function addBucket(bucket: Bucket) {
    if (!authStore.spreadsheetId) return;
    await sheetsClient.appendValues(authStore.spreadsheetId, 'Buckets!A:E', [[
      bucket.bucketId,
      bucket.name,
      bucket.monthlyCap,
      bucket.sortOrder,
      bucket.archived
    ]]);
    await fetchBuckets();
  }

  async function updateBucket(updatedBucket: Bucket) {
    if (!authStore.spreadsheetId) return;
    const index = buckets.value.findIndex(b => b.bucketId === updatedBucket.bucketId);
    if (index === -1) return;

    const range = `Buckets!A${index + 2}:E${index + 2}`;
    await sheetsClient.updateValues(authStore.spreadsheetId, range, [[
      updatedBucket.bucketId,
      updatedBucket.name,
      updatedBucket.monthlyCap,
      updatedBucket.sortOrder,
      updatedBucket.archived
    ]]);
    await fetchBuckets();
  }

  async function ensureMonthlySheet(month: string) {
    if (!authStore.spreadsheetId) return;
    try {
      const ss = await sheetsClient.getSpreadsheet(authStore.spreadsheetId);
      const sheetExists = ss.sheets.some((s: any) => s.properties.title === month);
      
      if (!sheetExists) {
        await sheetsClient.batchUpdate(authStore.spreadsheetId, [
          { addSheet: { properties: { title: month } } }
        ]);
        await sheetsClient.updateValues(authStore.spreadsheetId, `${month}!A1:H1`, [[
          'entryId', 'date', 'amount', 'bucketId', 'tags', 'note', 'createdAt', 'updatedAt'
        ]]);
      }
    } catch (e) {
      console.error('Failed to ensure monthly sheet', e);
    }
  }

  async function fetchTransactions(month: string) {
    if (!authStore.spreadsheetId) return;
    currentMonth.value = month;
    loading.value = true;
    try {
      await ensureMonthlySheet(month);
      const res = await sheetsClient.getValues(authStore.spreadsheetId, `${month}!A2:H1000`);
      if (res.values) {
        transactions.value = res.values.map((row: any[]) => ({
          entryId: row[0],
          date: row[1],
          amount: Number(row[2]),
          bucketId: row[3],
          tags: row[4],
          note: row[5],
          createdAt: row[6],
          updatedAt: row[7],
        }));
      } else {
        transactions.value = [];
      }
    } catch (e) {
      console.error('Failed to fetch transactions', e);
    } finally {
      loading.value = false;
    }
  }

  async function addTransaction(t: Omit<Transaction, 'entryId' | 'createdAt' | 'updatedAt'>) {
    if (!authStore.spreadsheetId) return;
    const entryId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newTransaction: Transaction = {
      ...t,
      entryId,
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic update
    transactions.value.unshift(newTransaction);

    try {
      const month = format(parseISO(t.date), 'MMMM-yyyy');
      await ensureMonthlySheet(month);
      await sheetsClient.appendValues(authStore.spreadsheetId, `${month}!A:H`, [[
        newTransaction.entryId,
        newTransaction.date,
        newTransaction.amount,
        newTransaction.bucketId,
        newTransaction.tags,
        newTransaction.note,
        newTransaction.createdAt,
        newTransaction.updatedAt
      ]]);
    } catch (e) {
      // Rollback on error
      transactions.value = transactions.value.filter(item => item.entryId !== entryId);
      console.error('Failed to add transaction', e);
      throw e;
    }
  }

  return {
    transactions,
    buckets,
    allTags,
    loading,
    currentMonth,
    currentMonthTransactions,
    bucketTotals,
    bootstrapSpreadsheet,
    fetchBuckets,
    fetchTransactions,
    addTransaction,
    addBucket,
    updateBucket,
  };
});
