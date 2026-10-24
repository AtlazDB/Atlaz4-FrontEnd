<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { useTema } from '@/composables/useTema'

const route = useRoute()
const { claro, alternar } = useTema()

const titulo = computed(() => route.meta.titulo ?? 'GeoRural DataHub')
const trilha = computed(() => route.meta.grupo ?? '')
</script>

<template>
  <header
    class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/30
           px-4 py-4 backdrop-blur-lg md:px-7"
  >
    <div class="min-w-0">
      <p class="mb-0.5 truncate text-[11px] text-slate-500">{{ trilha }}</p>
      <h1 class="truncate font-display text-xl font-semibold tracking-tight text-white">{{ titulo }}</h1>
    </div>

    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium
             text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
      :title="claro ? 'Mudar para o modo escuro' : 'Mudar para o modo claro'"
      :aria-label="claro ? 'Mudar para o modo escuro' : 'Mudar para o modo claro'"
      @click="alternar"
    >
      <AppIcon :nome="claro ? 'lua' : 'sol'" class="h-4 w-4" />
      <span class="hidden lg:inline">{{ claro ? 'Modo escuro' : 'Modo claro' }}</span>
    </button>
  </header>
</template>
