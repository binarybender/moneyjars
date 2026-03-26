<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import { Home, List, PieChart, Settings, Cylinder } from 'lucide-vue-next';

const route = useRoute();

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Ledger', path: '/ledger', icon: List },
  { name: 'Jars', path: '/jars', icon: Cylinder },
  { name: 'Insights', path: '/insights', icon: PieChart },
  { name: 'Settings', path: '/settings', icon: Settings },
];
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/80 backdrop-blur-xl border-t border-neutral-200/50 flex items-center justify-around shadow-2xl shadow-neutral-200">
    <RouterLink
      v-for="item in navItems"
      :key="item.name"
      :to="item.path"
      class="relative flex flex-col items-center gap-1 p-2 transition-all active:scale-95 group"
    >
      <div
        :class="[
          'p-2 rounded-2xl transition-all duration-300',
          route.path === item.path
            ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
            : 'text-neutral-400 group-hover:bg-neutral-50 group-hover:text-neutral-600'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5" />
      </div>
      <span
        :class="[
          'text-[10px] font-bold uppercase tracking-widest transition-all duration-300',
          route.path === item.path ? 'text-orange-600 opacity-100' : 'text-neutral-400 opacity-0 group-hover:opacity-100'
        ]"
      >
        {{ item.name }}
      </span>
    </RouterLink>
  </nav>
</template>
