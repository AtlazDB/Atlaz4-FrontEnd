<script setup>
import { computed, ref } from 'vue'
import MapaGeometria from '@/components/quarentena/MapaGeometria.vue'
import { formatarDataHora } from '@/utils/formato'
import {
  TIPOS_ERRO,
  STATUS,
  ENCERRADOS,
  nomeErro,
  nomeEntidade,
  pontoDoMotivo,
  formatarPayload,
} from '@/utils/quarentena'

// Payload e justificativa são v-model porque quem envia as ações é a view.
const props = defineProps({
  registro: { type: Object, required: true },
  geometria: { type: Object, default: null },
  carregandoGeometria: { type: Boolean, default: false },
  revalidacao: { type: Object, default: null },
})

const payload = defineModel('payload', { type: String, default: '' })
const justificativa = defineModel('justificativa', { type: String, default: '' })

const editando = ref(false)

function minusculaInicial(texto) {
  return texto.charAt(0).toLowerCase() + texto.slice(1)
}

const tipo = computed(() => TIPOS_ERRO[props.registro.tipoErro])
const status = computed(() => STATUS[props.registro.statusAnalise] ?? STATUS.PENDENTE)
const encerrado = computed(() => ENCERRADOS.includes(props.registro.statusAnalise))
const ponto = computed(() => pontoDoMotivo(props.registro.motivo))
const original = computed(() => formatarPayload(props.registro.payload))
const temCorrecao = computed(() => !!props.registro.payloadCorrigido)

const historico = computed(() => {
  const r = props.registro
  const linhas = [
    {
      titulo: 'Retido na validação',
      texto: `execução #${r.execucaoId}${r.numeroLinha ? ` · linha ${r.numeroLinha}` : ''} · ${minusculaInicial(nomeErro(r.tipoErro))}${r.campo ? ` no campo ${r.campo}` : ''}`,
      cor: 'border-amber-400',
    },
  ]
  const quando = r.analisadoEm ? ` · ${formatarDataHora(r.analisadoEm)}` : ''
  const quem = r.analisadoPor ? ` · por ${r.analisadoPor}` : ''
  if (r.statusAnalise === 'EM_ANALISE') {
    linhas.push({ titulo: 'Análise iniciada', texto: `aguardando correção ou descarte${quem}`, cor: 'border-cyan-400' })
  }
  if (r.statusAnalise === 'CORRIGIDO') {
    linhas.push({ titulo: 'Correção salva', texto: `falta revalidar${quando}${quem}`, cor: 'border-indigo-400' })
  }
  if (r.statusAnalise === 'REVALIDADO') {
    linhas.push({ titulo: 'Revalidado e gravado na zona tratada', texto: `passou em todas as regras${quando}${quem}`, cor: 'border-emerald-400' })
  }
  if (r.statusAnalise === 'DESCARTADO') {
    linhas.push({ titulo: 'Descartado', texto: `${r.justificativa || 'sem justificativa'}${quando}${quem}`, cor: 'border-slate-500' })
  }
  if (r.statusAnalise === 'SUBSTITUIDO') {
    linhas.push({ titulo: 'Substituído por uma carga mais nova', texto: r.justificativa || '', cor: 'border-slate-500' })
  }
  return linhas
})

function abrirEditor() {
  if (!payload.value) payload.value = formatarPayload(props.registro.payloadCorrigido || props.registro.payload)
  editando.value = true
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <span :class="['rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', status.classe]">
        {{ status.rotulo }}
      </span>
      <span
        v-if="registro.tipoErro"
        class="rounded-md border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 font-mono text-[10.5px] text-rose-300"
      >
        {{ registro.tipoErro }}
      </span>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div class="space-y-4">
        <section class="rounded-xl border border-rose-500/30 bg-rose-500/[0.06] p-4">
          <p class="text-[14px] font-semibold text-rose-200">{{ nomeErro(registro.tipoErro) }}</p>
          <dl class="mt-3 space-y-2.5 text-sm">
            <div v-if="registro.campo">
              <dt class="label">Campo</dt>
              <dd class="font-mono text-[12.5px] text-slate-200">{{ registro.campo }}</dd>
            </div>
            <div v-if="registro.valorRecebido">
              <dt class="label">Valor recebido</dt>
              <dd class="max-h-24 overflow-auto break-all rounded-lg border border-slate-800 bg-slate-950/60 p-2 font-mono text-[11.5px] text-slate-300">
                {{ registro.valorRecebido }}
              </dd>
            </div>
            <div>
              <dt class="label">Motivo</dt>
              <dd class="break-words text-slate-200">{{ registro.motivo || '—' }}</dd>
            </div>
          </dl>
        </section>

        <section v-if="tipo" class="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
          <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">O que isso significa</p>
          <p class="mt-1 text-[12.5px] text-slate-300">{{ tipo.explica }}</p>
          <p class="mt-3 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">Como resolver</p>
          <p class="mt-1 text-[12.5px] text-slate-300">{{ tipo.como }}</p>
        </section>
      </div>

      <section class="space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
        <p class="text-[12.5px] font-semibold text-slate-200">Geometria</p>
        <div
          v-if="carregandoGeometria"
          class="grid h-[250px] place-items-center rounded-lg border border-slate-800 text-[12px] text-slate-500"
        >
          Carregando a geometria…
        </div>
        <template v-else-if="geometria">
          <MapaGeometria :geometria="geometria" :ponto="ponto" />
          <p class="flex items-center gap-2 text-[11px] text-slate-400">
            <template v-if="ponto">
              <span class="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
              Ponto onde está o problema
            </template>
            <template v-else>Como chegou no arquivo, sem nenhuma correção.</template>
          </p>
        </template>
        <div
          v-else
          class="grid h-[250px] place-items-center rounded-lg border border-dashed border-slate-700 px-6 text-center text-[12px] text-slate-500"
        >
          Este registro não tem geometria que possa ser desenhada.
        </div>
      </section>
    </div>

    <section class="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p class="text-[12.5px] font-semibold text-slate-200">
          Dado original <span class="font-normal text-slate-500">· zona bruta, nunca alterado</span>
        </p>
        <button
          v-if="!encerrado && !editando"
          type="button"
          class="rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-medium text-slate-300
                 transition hover:border-slate-500 hover:text-slate-100"
          @click="abrirEditor"
        >
          {{ temCorrecao ? 'Editar a correção' : 'Corrigir manualmente' }}
        </button>
      </div>
      <pre
        :class="[
          'max-h-56 overflow-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3 font-mono text-[11.5px] leading-relaxed text-slate-300',
          editando && 'opacity-50',
        ]"
      >{{ original || '—' }}</pre>

      <div v-if="editando">
        <label class="label mt-3" for="payload-corrigido">Cópia de trabalho · a correção fica guardada à parte</label>
        <textarea id="payload-corrigido" v-model="payload" class="input h-36 font-mono text-[11.5px]" spellcheck="false" />
      </div>
      <div v-else-if="temCorrecao" class="mt-3">
        <p class="label">Correção salva</p>
        <pre class="max-h-40 overflow-auto rounded-lg border border-indigo-500/30 bg-indigo-500/[0.06] p-3 font-mono text-[11.5px] text-slate-300">{{ formatarPayload(registro.payloadCorrigido) }}</pre>
      </div>
    </section>

    <section
      v-if="revalidacao && revalidacao.status !== 'APROVADO'"
      class="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5"
    >
      <p class="text-[12.5px] font-semibold text-rose-200">A revalidação reprovou o registro de novo</p>
      <ul class="mt-2 space-y-1.5 text-[12px] text-rose-100/90">
        <li v-for="(e, i) in revalidacao.erros" :key="i">
          <b>{{ nomeErro(e.tipo_erro) }}</b><span v-if="e.campo"> em {{ e.campo }}</span>: {{ e.motivo }}
        </li>
      </ul>
    </section>

    <section class="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
      <p class="mb-3 text-[12.5px] font-semibold text-slate-200">Histórico deste registro</p>
      <ol>
        <li v-for="(h, i) in historico" :key="i" class="relative flex gap-3 pb-3 last:pb-0">
          <span
            v-if="i < historico.length - 1"
            class="absolute left-[11px] top-6 h-[calc(100%-16px)] w-0.5 bg-slate-700/60"
          />
          <span :class="['relative mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 bg-slate-950', h.cor]" />
          <div class="min-w-0">
            <p class="text-[12.5px] font-medium text-slate-200">{{ h.titulo }}</p>
            <p class="break-words text-[11.5px] text-slate-500">{{ h.texto }}</p>
          </div>
        </li>
      </ol>
    </section>

    <section v-if="!encerrado">
      <label class="label" for="justificativa">
        Justificativa <span class="text-slate-500">· obrigatória para descartar</span>
      </label>
      <textarea
        id="justificativa"
        v-model="justificativa"
        class="input h-16"
        placeholder="Ex.: imóvel cancelado na base original; ponto fora do Paraná"
      />
    </section>

    <p class="text-[11px] text-slate-500">
      {{ nomeEntidade(registro.entidade) }}<span v-if="registro.datasetVersaoId"> · versão de dados #{{ registro.datasetVersaoId }}</span>
    </p>
  </div>
</template>
