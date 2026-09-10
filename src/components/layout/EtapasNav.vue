<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import { etapas } from '@/router/etapas'

/**
 * Trilha das etapas do fluxo de dados.
 *
 * Componente só de apresentação: ele lê a rota atual para saber onde o
 * usuário está e deriva o resto. Não guarda estado nenhum.
 */
const route = useRoute()

const indiceAtual = computed(() => {
  const i = etapas.findIndex((etapa) => etapa.rota === route.name)
  return i === -1 ? 0 : i
})

/** 'concluida' | 'atual' | 'futura' */
function situacao(indice) {
  if (indice < indiceAtual.value) return 'concluida'
  if (indice === indiceAtual.value) return 'atual'
  return 'futura'
}

const circulo = {
  concluida: 'border-emerald-400 text-emerald-300',
  atual: 'border-cyan-400 text-cyan-300 shadow-[0_0_0_4px_rgba(34,211,238,0.15)]',
  futura: 'border-slate-700 text-slate-500',
}

const rotulo = {
  concluida: 'text-slate-300',
  atual: 'text-white',
  futura: 'text-slate-500',
}
</script>

<template>
  <nav class="glass px-6 py-5" aria-label="Etapas do fluxo de dados">
    <ol class="flex items-start overflow-x-auto">
      <li
        v-for="(etapa, i) in etapas"
        :key="etapa.rotulo"
        class="relative flex min-w-[150px] flex-1 flex-col items-center px-2"
      >
        <!-- Linha que liga esta etapa à anterior -->
        <span
          v-if="i > 0"
          class="absolute right-1/2 top-[17px] h-0.5 w-full rounded-full"
          :class="
            i <= indiceAtual
              ? 'bg-gradient-to-r from-emerald-500/70 to-emerald-500/30'
              : 'bg-gradient-to-r from-slate-600/40 to-slate-600/15'
          "
        />

        <component
          :is="etapa.rota ? 'RouterLink' : 'span'"
          :to="etapa.rota ? { name: etapa.rota } : undefined"
          :aria-current="i === indiceAtual ? 'step' : undefined"
          class="relative grid h-9 w-9 place-items-center rounded-full border-2 bg-base
                 font-mono text-xs font-semibold transition"
          :class="[circulo[situacao(i)], etapa.rota ? 'hover:brightness-125' : 'cursor-default']"
        >
          <AppIcon v-if="situacao(i) === 'concluida'" nome="check" traco="3" class="h-4 w-4" />
          <template v-else>{{ i + 1 }}</template>
        </component>

        <p class="mt-2 text-center text-[12.5px] font-semibold" :class="rotulo[situacao(i)]">
          {{ i + 1 }}. {{ etapa.rotulo }}
        </p>
      </li>
    </ol>
  </nav>
</template>
