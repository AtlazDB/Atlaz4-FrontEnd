<script setup>
import { computed } from 'vue'

/**
 * Etiqueta de status de uma fonte.
 * Cores seguem a convenção do protótipo:
 *   emerald = tudo certo | amber = atenção | slate = neutro
 */
const props = defineProps({
  status: { type: String, default: 'pendente' },
})

const mapa = {
  ativa: { rotulo: 'Ativa', classe: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/40' },
  pendente: { rotulo: 'Sem arquivo', classe: 'text-amber-300 bg-amber-500/10 border-amber-500/40' },
  inativa: { rotulo: 'Inativa', classe: 'text-slate-400 bg-slate-500/10 border-slate-500/40' },
}

const info = computed(() => mapa[props.status] ?? mapa.pendente)
</script>

<template>
  <span
    :class="[
      'inline-block rounded-full border px-2 py-0.5 whitespace-nowrap',
      'text-[10px] font-semibold uppercase tracking-wide',
      info.classe,
    ]"
  >
    {{ info.rotulo }}
  </span>
</template>
