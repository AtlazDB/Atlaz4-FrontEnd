<script setup>
import StatusBadge from '@/components/StatusBadge.vue'
import AppIcon from '@/components/AppIcon.vue'
import { formatarTamanho, formatarDataHora } from '@/utils/formato'

/**
 * Componente de APRESENTAÇÃO — está pronto, não precisa mexer.
 *
 * Ele não sabe que existe uma API: só recebe uma lista via props e
 * avisa o pai (a ImportacaoView) quando alguém clica em algo, via emit.
 * Esse é o padrão "props para baixo, eventos para cima" do Vue.
 *
 * Cada fonte tem um botão "#" ao lado que abre o mapeamento de colunas.
 * Quando a fonte tem colunas novas sem mapeamento, aparece um aviso âmbar
 * e o "#" ganha destaque.
 */
defineProps({
  fontes: { type: Array, required: true },
  carregando: { type: Boolean, default: false },
  erro: { type: String, default: '' },
  selecionadaId: { type: [Number, null], default: null },
  /** id da fonte → quantidade de colunas novas sem mapeamento */
  novas: { type: Object, default: () => ({}) },
})

defineEmits(['selecionar', 'mapear', 'tentar-novamente'])
</script>

<template>
  <!-- Estado 1: carregando -->
  <div v-if="carregando" class="space-y-2">
    <div
      v-for="n in 3"
      :key="n"
      class="h-[72px] rounded-xl bg-slate-800/30 animate-pulse"
    />
  </div>

  <!-- Estado 2: deu erro -->
  <div
    v-else-if="erro"
    class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm"
  >
    <p class="font-medium text-red-300">Não deu para carregar as fontes</p>
    <p class="mt-1 text-red-300/70">{{ erro }}</p>
    <button
      class="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-200
             underline underline-offset-2"
      @click="$emit('tentar-novamente')"
    >
      <AppIcon nome="atualizar" traco="2.4" class="h-3.5 w-3.5" />
      Tentar de novo
    </button>
  </div>

  <!-- Estado 3: lista vazia -->
  <div
    v-else-if="!fontes.length"
    class="rounded-xl border border-dashed border-slate-700 p-8 text-center"
  >
    <p class="text-sm text-slate-400">Nenhuma fonte cadastrada ainda.</p>
    <p class="mt-1 text-xs text-slate-600">
      Use &ldquo;Nova fonte&rdquo; para registrar a primeira origem de dados.
    </p>
  </div>

  <!-- Estado 4: a lista de verdade -->
  <ul v-else class="space-y-2">
    <li v-for="fonte in fontes" :key="fonte.id" class="flex items-stretch gap-2">
      <button
        :class="[
          'min-w-0 flex-1 text-left rounded-xl border p-3.5 transition',
          selecionadaId === fonte.id
            ? 'border-cyan-500/50 bg-cyan-500/10'
            : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60',
        ]"
        @click="$emit('selecionar', fonte)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-mono text-[11px] text-cyan-400">{{ fonte.sigla }}</span>
              <StatusBadge :status="fonte.status" />
              <span
                v-if="novas[fonte.id] > 0"
                class="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5
                       text-[10px] font-semibold text-amber-300"
                :title="`${novas[fonte.id]} coluna(s) nova(s) sem mapeamento`"
              >
                {{ novas[fonte.id] }} {{ novas[fonte.id] === 1 ? 'nova' : 'novas' }}
              </span>
            </div>
            <p class="text-sm font-medium text-slate-100 mt-1 truncate">{{ fonte.nome }}</p>
            <p class="text-xs text-slate-500 truncate">{{ fonte.orgao }}</p>
          </div>
          <span class="shrink-0 font-mono text-[10px] text-slate-600 uppercase">
            {{ fonte.formato }}
          </span>
        </div>

        <div
          v-if="fonte.arquivos?.length"
          class="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center gap-2 text-[11px]"
        >
          <AppIcon nome="check" traco="3" class="h-3 w-3 shrink-0 text-emerald-400" />
          <span class="text-slate-400 truncate">{{ fonte.arquivos[0].nome }}</span>
          <span class="text-slate-600 shrink-0">
            {{ formatarTamanho(fonte.arquivos[0].tamanho) }} ·
            {{ formatarDataHora(fonte.arquivos[0].enviadoEm) }}
          </span>
        </div>
      </button>

      <!-- Botão irmão (não dentro do outro: botão dentro de botão é HTML inválido) -->
      <button
        type="button"
        :class="[
          'w-10 shrink-0 rounded-xl border font-mono text-base font-semibold transition',
          novas[fonte.id] > 0
            ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
            : 'border-slate-800 bg-slate-950/40 text-slate-500 hover:border-slate-700 hover:text-slate-200',
        ]"
        title="Mapear colunas"
        :aria-label="`Mapear colunas de ${fonte.sigla}`"
        @click="$emit('mapear', fonte)"
      >
        #
      </button>
    </li>
  </ul>
</template>