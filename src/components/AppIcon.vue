<script setup>
import { icones } from '@/components/icones'

/**
 * Ícone em SVG. O tamanho e a cor vêm de fora, por classe do Tailwind —
 * o traço herda `currentColor`:
 *
 *   <AppIcon nome="upload" class="h-4 w-4 text-cyan-400" />
 *
 * Para acrescentar um ícone novo, some uma entrada em icones.js.
 */
defineProps({
  nome: {
    type: String,
    required: true,
    validator: (v) => v in icones,
  },
  traco: { type: [Number, String], default: 2 },
})
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="traco"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="d in icones[nome]" :key="d" :d="d" />
  </svg>
</template>
