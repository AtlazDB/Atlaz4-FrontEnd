<script setup>
import { computed, ref, watch } from 'vue'
import { formatarGeoJson, lerGeoJson, resumirGeometria } from '@/utils/geojson'

/**
 * A geometria em texto (GeoJSON), ao lado do mapa: ver como chegou, copiar e
 * editar a correção à mão. Partes e buracos ficam como estão: o texto é o
 * próprio "geometry", com cada vértice [longitude, latitude] numa linha.
 *
 * Componente de apresentação: "Aplicar no mapa" só emite 'aplicar' com a
 * geometria lida; quem a põe em verde no mapa e salva é o AnaliseRegistro.
 */
const props = defineProps({
  /** como chegou no arquivo (null quando não pôde ser lida) */
  original: { type: Object, default: null },
  /** a correção em verde (salva, prévia ou editada no mapa) */
  trabalho: { type: Object, default: null },
  /** o valor bruto da coluna, quando a geometria não pôde ser lida */
  valorRecebido: { type: String, default: '' },
  editavel: { type: Boolean, default: false },
})

const emit = defineEmits(['aplicar'])

const temCorrecao = computed(() => !!props.trabalho || props.editavel)
const aba = ref('original') // original | correcao
const texto = ref('')
const erro = ref('')
const copiado = ref(false)

// A correção muda no mapa (vértices, correção automática): o texto acompanha.
// Sem correção ainda, a edição começa de uma cópia da original.
function recarregarTexto() {
  texto.value = formatarGeoJson(props.trabalho ?? props.original)
  erro.value = ''
}
watch(() => [props.trabalho, props.original], recarregarTexto, { immediate: true })

// Já com correção, abre nela; sem geometria nenhuma, abre no editor.
watch(
  () => [props.trabalho, props.original],
  () => {
    if (props.trabalho || (!props.original && props.editavel)) aba.value = 'correcao'
  },
  { immediate: true },
)

const textoMostrado = computed(() =>
  aba.value === 'original' ? formatarGeoJson(props.original) : texto.value,
)

const resumo = computed(() => {
  if (aba.value === 'original') return resumirGeometria(props.original)
  try {
    return resumirGeometria(lerGeoJson(texto.value))
  } catch {
    return null
  }
})

const NOMES = {
  Point: 'Ponto',
  MultiPoint: 'Pontos',
  LineString: 'Linha',
  MultiLineString: 'Linhas',
  Polygon: 'Polígono',
  MultiPolygon: 'Multipolígono',
}

function aplicar() {
  try {
    emit('aplicar', lerGeoJson(texto.value))
    erro.value = ''
  } catch (e) {
    erro.value = e.message
  }
}

async function copiar() {
  try {
    await navigator.clipboard.writeText(textoMostrado.value)
    copiado.value = true
    setTimeout(() => (copiado.value = false), 2000)
  } catch {
    erro.value = 'O navegador não deixou copiar: selecione o texto e use Ctrl+C.'
  }
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex flex-wrap items-center gap-2">
      <div class="inline-flex rounded-lg border border-slate-800 bg-slate-950/40 p-0.5" role="tablist">
        <button
          type="button"
          role="tab"
          :aria-selected="aba === 'original'"
          :class="['aba', aba === 'original' && 'aba-ativa']"
          :disabled="!original"
          @click="aba = 'original'"
        >
          Como chegou
        </button>
        <button
          v-if="temCorrecao"
          type="button"
          role="tab"
          :aria-selected="aba === 'correcao'"
          :class="['aba', aba === 'correcao' && 'aba-ativa']"
          @click="aba = 'correcao'"
        >
          Correção
        </button>
      </div>
      <span v-if="resumo" class="font-mono text-[10.5px] text-slate-500">
        {{ NOMES[resumo.tipo] }}
        <template v-if="resumo.partes > 1"> · {{ resumo.partes }} partes</template>
        <template v-if="resumo.aneis > resumo.partes"> · {{ resumo.aneis - resumo.partes }} buraco(s)</template>
        · {{ resumo.vertices }} vértices
      </span>
      <button
        type="button"
        class="ml-auto rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-300 transition hover:border-slate-500 hover:text-slate-100 disabled:opacity-40"
        :disabled="!textoMostrado"
        @click="copiar"
      >
        {{ copiado ? 'Copiado' : 'Copiar' }}
      </button>
    </div>

    <pre
      v-if="aba === 'original' || !editavel"
      class="h-[250px] overflow-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3 font-mono text-[11px] leading-relaxed text-slate-300"
    >{{ textoMostrado || '—' }}</pre>
    <template v-else>
      <textarea
        v-model="texto"
        class="input h-[250px] font-mono text-[11px] leading-relaxed"
        spellcheck="false"
        aria-label="GeoJSON da correção"
        :placeholder="'{\n  &quot;type&quot;: &quot;Polygon&quot;,\n  &quot;coordinates&quot;: [[[-51.4, -24.2], [-51.3, -24.2], [-51.3, -24.1], [-51.4, -24.2]]]\n}'"
        @input="erro = ''"
      />
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded-lg border border-emerald-500/50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-40"
          :disabled="!texto.trim()"
          @click="aplicar"
        >
          Aplicar no mapa
        </button>
        <button
          type="button"
          class="rounded-lg px-2 py-1.5 text-[11px] text-slate-400 hover:text-slate-200"
          @click="recarregarTexto"
        >
          Voltar ao que está no mapa
        </button>
      </div>
      <p class="text-[11px] text-slate-500">
        Cada vértice é <span class="font-mono">[longitude, latitude]</span> e o primeiro vértice de cada anel
        se repete no fim. Aceita também uma Feature colada de outra ferramenta.
      </p>
    </template>

    <div v-if="!original && valorRecebido" class="space-y-1">
      <p class="text-[11px] text-slate-500">Valor recebido no arquivo (não pôde ser lido como geometria):</p>
      <pre class="max-h-24 overflow-auto break-all rounded-lg border border-slate-800 bg-slate-950/60 p-2 font-mono text-[11px] text-slate-400">{{ valorRecebido }}</pre>
    </div>

    <p v-if="erro" class="text-[11.5px] text-rose-300">{{ erro }}</p>
  </div>
</template>

<style scoped>
.aba {
  @apply rounded-md px-2.5 py-1 text-[11px] font-medium text-slate-400 transition hover:text-slate-200 disabled:opacity-40;
}
.aba-ativa {
  @apply bg-slate-800 text-white;
}
</style>
