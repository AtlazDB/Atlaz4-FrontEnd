<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { formatarArea } from '@/utils/formato'

/**
 * Tabela dos imóveis filtrados. Mesmo padrão da FonteList: quatro estados
 * (carregando, erro, vazia, preenchida) e nenhuma chamada à API.
 */
const props = defineProps({
  imoveis: { type: Array, required: true },
  carregando: { type: Boolean, default: false },
  erro: { type: String, default: '' },
  selecionadoCod: { type: String, default: null },
})

defineEmits(['selecionar', 'tentar-novamente'])

const areaTotal = computed(() =>
  props.imoveis.reduce((soma, imovel) => soma + (Number(imovel.areaHa) || 0), 0),
)
</script>

<template>
  <!-- Estado 1: carregando -->
  <div v-if="carregando" class="space-y-2">
    <div v-for="n in 4" :key="n" class="h-10 animate-pulse rounded-lg bg-slate-800/30" />
  </div>

  <!-- Estado 2: deu erro -->
  <div v-else-if="erro" class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
    <p class="font-medium text-red-300">Não deu para carregar os imóveis</p>
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

  <!-- Estado 3: nenhum imóvel -->
  <div
    v-else-if="!imoveis.length"
    class="rounded-xl border border-dashed border-slate-700 p-8 text-center"
  >
    <p class="text-sm text-slate-400">Nenhum imóvel encontrado.</p>
    <p class="mt-1 text-xs text-slate-600">Tente outro município ou limpe o filtro.</p>
  </div>

  <!-- Estado 4: a tabela -->
  <div v-else>
    <div class="max-h-[440px] overflow-auto rounded-xl border border-slate-800">
      <table class="w-full text-left text-sm">
        <thead class="sticky top-0 bg-slate-900 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-3 py-2.5 font-medium">Código do imóvel</th>
            <th class="px-3 py-2.5 font-medium">Município</th>
            <th class="px-3 py-2.5 font-medium">UF</th>
            <th class="px-3 py-2.5 text-right font-medium">Área</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/80">
          <tr
            v-for="imovel in imoveis"
            :key="imovel.codImovel"
            tabindex="0"
            :aria-selected="selecionadoCod === imovel.codImovel"
            class="cursor-pointer transition focus:outline-none focus-visible:bg-slate-800/60"
            :class="
              selecionadoCod === imovel.codImovel
                ? 'bg-cyan-500/10 text-cyan-100'
                : 'text-slate-300 hover:bg-slate-900/60'
            "
            @click="$emit('selecionar', imovel.codImovel)"
            @keydown.enter.prevent="$emit('selecionar', imovel.codImovel)"
            @keydown.space.prevent="$emit('selecionar', imovel.codImovel)"
          >
            <td class="px-3 py-2.5 font-mono text-[12px] text-cyan-400">{{ imovel.codImovel }}</td>
            <td class="px-3 py-2.5">{{ imovel.municipio ?? '—' }}</td>
            <td class="px-3 py-2.5">{{ imovel.estado ?? '—' }}</td>
            <td class="whitespace-nowrap px-3 py-2.5 text-right">{{ formatarArea(imovel.areaHa) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="mt-2.5 text-right text-xs text-slate-500">
      {{ imoveis.length }} {{ imoveis.length === 1 ? 'imóvel' : 'imóveis' }} ·
      {{ formatarArea(areaTotal) }} no total
    </p>
  </div>
</template>
