<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseButton from '@/components/BaseButton.vue'
import { buscarHistorico } from '@/services/indicadoresService'
import { formatarArea, formatarDataHora } from '@/utils/formato'
import {
  NOMES,
  coresStatus,
  formatarDecimal,
  formatarValor,
  hashCurto,
  rotuloStatus,
  rotuloVersao,
} from '@/utils/indicadores'

/**
 * Rastreabilidade de um indicador: de quais arquivos ele saiu, por qual
 * execução passaram e qual regra fez a conta. É o que permite justificar o
 * número numa auditoria.
 *
 * O imóvel e o indicador ficam na URL (?imovel=&indicador=), então o link
 * do card da Consulta territorial cai direto no número certo.
 */
const route = useRoute()
const router = useRouter()

const codigoDigitado = ref(route.query.imovel ?? '')
const historico = ref([])
const carregando = ref(false)
const erro = ref('')
let pedidoAtual = 0

const codImovel = computed(() => (route.query.imovel ?? '').toString())
const indicador = computed(() => (route.query.indicador === 'IFC' ? 'IFC' : 'IRL'))
const atual = computed(() => historico.value[0] ?? null)
const anterior = computed(() => historico.value[1] ?? null)

async function carregar() {
  const pedido = ++pedidoAtual
  historico.value = []
  erro.value = ''
  if (!codImovel.value) return

  carregando.value = true
  try {
    const lista = await buscarHistorico(codImovel.value, indicador.value)
    if (pedido === pedidoAtual) historico.value = lista
  } catch (e) {
    if (pedido === pedidoAtual) erro.value = e.message
  } finally {
    if (pedido === pedidoAtual) carregando.value = false
  }
}

function consultar() {
  router.replace({ query: { imovel: codigoDigitado.value.trim(), indicador: indicador.value } })
}

function trocarIndicador(sigla) {
  router.replace({ query: { ...route.query, indicador: sigla } })
}

watch(
  () => [codImovel.value, indicador.value],
  () => {
    codigoDigitado.value = codImovel.value
    carregar()
  },
  { immediate: true },
)

// --- Textos da conta --------------------------------------------------

const ehIrl = computed(() => indicador.value === 'IRL')
const minimo = computed(() => atual.value?.regra?.parametros?.percentual_minimo ?? 20)

const papeis = computed(() =>
  ehIrl.value
    ? { imovel: 'Área do imóvel', insumo: 'Área de Reserva Legal' }
    : { imovel: 'Contorno e área do imóvel', insumo: 'Focos de calor da janela' },
)

const conta = computed(() => {
  const i = atual.value
  if (!i) return ''
  if (ehIrl.value) {
    return `${formatarArea(i.numerador)} de RL ÷ ${formatarArea(i.areaImovelHa)} do imóvel × 100 = ${formatarValor(i)}`
  }
  const focos = Number(i.numerador) === 1 ? 'foco' : 'focos'
  return `${formatarDecimal(i.numerador, 0)} ${focos} ÷ ${formatarArea(i.areaImovelHa)} × 1.000 = ${formatarValor(i)}`
})

const conclusao = computed(() => {
  const i = atual.value
  if (!i) return null
  if (ehIrl.value) {
    return Number(i.saldoHa) < 0
      ? { texto: `Abaixo do mínimo de ${minimo.value}%: faltam ${formatarDecimal(-i.saldoHa, 2)} ha de Reserva Legal.`, cor: 'text-rose-300' }
      : { texto: `Acima do mínimo de ${minimo.value}%: sobram ${formatarDecimal(i.saldoHa, 2)} ha.`, cor: 'text-emerald-300' }
  }
  const limite = i.regra?.parametros?.limite_critico ?? 20
  if (Number(i.numerador) === 0) return { texto: 'Nenhum foco dentro do imóvel na janela.', cor: 'text-emerald-300' }
  return Number(i.valor) >= limite
    ? { texto: `Igual ou acima de ${limite}: Crítico.`, cor: 'text-rose-300' }
    : { texto: `Abaixo de ${limite}: Alerta.`, cor: 'text-amber-300' }
})

/** Cada parâmetro da regra numa linha legível. */
const parametros = computed(() =>
  Object.entries(atual.value?.regra?.parametros ?? {}).map(([nome, valor]) => [nome.replaceAll('_', ' '), valor]),
)

// --- Comparação com o cálculo anterior --------------------------------

const comparacao = computed(() => {
  const agora = atual.value
  const antes = anterior.value
  if (!agora || !antes) return []
  const numerador = ehIrl.value ? 'Área de RL' : 'Focos no imóvel'
  const formatar = (i) => (ehIrl.value ? formatarArea(i.numerador) : formatarDecimal(i.numerador, 0))
  return [
    ['Área do imóvel', formatarArea(antes.areaImovelHa), formatarArea(agora.areaImovelHa)],
    [numerador, formatar(antes), formatar(agora)],
    ['Versão do CAR', rotuloVersao(antes.versaoImovel), rotuloVersao(agora.versaoImovel)],
    ['Versão do insumo', rotuloVersao(antes.versaoInsumo), rotuloVersao(agora.versaoInsumo)],
    ['Regra', `${antes.regra.codigo} v${antes.regra.versao}`, `${agora.regra.codigo} v${agora.regra.versao}`],
    [NOMES[indicador.value], formatarValor(antes), formatarValor(agora)],
  ].map(([campo, de, para]) => ({ campo, de, para, mudou: de !== para }))
})

/** O porquê da mudança: o dado, a regra, ou os dois. */
const motivoMudanca = computed(() => {
  const linhas = comparacao.value
  if (!linhas.length) return null
  const regraMudou = linhas.find((l) => l.campo === 'Regra').mudou
  const dadoMudou = linhas.slice(0, 4).some((l) => l.mudou)
  return { regraMudou, dadoMudou }
})
</script>

<template>
  <div class="space-y-5">
    <RouterLink
      :to="{ name: 'consulta' }"
      class="inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-200"
    >
      <AppIcon nome="voltar" class="h-3.5 w-3.5" />
      Voltar à Consulta territorial
    </RouterLink>

    <BaseCard
      destaque
      titulo="Rastreabilidade"
      icone="rastro"
      cor-icone="text-indigo-300"
      descricao="Escolha um imóvel e um indicador para ver o caminho completo do número: de quais arquivos ele saiu,
                 qual processamento passou por eles e qual regra fez a conta."
    >
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="consultar">
        <div class="w-full sm:w-96">
          <label class="label" for="rastro-imovel">Código do imóvel</label>
          <input
            id="rastro-imovel"
            v-model="codigoDigitado"
            class="input font-mono"
            placeholder="Ex.: PR-4119905-ABFE0C04…"
            autocomplete="off"
          />
        </div>
        <BaseButton type="submit" variante="secundario" :disabled="!codigoDigitado.trim()">
          Consultar
        </BaseButton>
        <div>
          <p class="label">Indicador</p>
          <div class="inline-flex rounded-xl border border-slate-800 bg-slate-950/40 p-1">
            <button
              v-for="sigla in ['IRL', 'IFC']"
              :key="sigla"
              type="button"
              class="rounded-lg px-3 py-1.5 text-[12px] font-medium transition"
              :class="indicador === sigla ? 'bg-cyan-500/15 text-cyan-300' : 'text-slate-400 hover:text-slate-200'"
              @click="trocarIndicador(sigla)"
            >
              {{ NOMES[sigla] }}
            </button>
          </div>
        </div>
      </form>
    </BaseCard>

    <!-- Estados -->
    <div v-if="!codImovel" class="glass p-8 text-center text-sm text-slate-400">
      Informe o código de um imóvel, ou use "De onde veio este número?" no card da Consulta territorial.
    </div>
    <div v-else-if="carregando" class="space-y-3">
      <div v-for="n in 2" :key="n" class="h-40 animate-pulse rounded-2xl bg-slate-800/30" />
    </div>
    <div v-else-if="erro" class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
      {{ erro }}
    </div>
    <div v-else-if="!atual" class="glass p-8 text-center">
      <p class="text-sm text-slate-300">Não há cálculo de {{ NOMES[indicador] }} para este imóvel.</p>
      <p class="mt-1 text-xs text-slate-500">
        O IRL só é calculado para imóveis de municípios com Reserva Legal carregada.
      </p>
    </div>

    <template v-else>
      <!-- O número -->
      <section class="glass p-5">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
              {{ NOMES[indicador] }} ·
              <span class="font-mono normal-case tracking-normal text-cyan-400">{{ codImovel }}</span>
            </p>
            <p class="mt-1 flex items-center gap-3">
              <span :class="['font-display text-4xl font-semibold tabular-nums', coresStatus(atual).texto]">
                {{ formatarValor(atual) }}
              </span>
              <span
                :class="['rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', coresStatus(atual).etiqueta]"
              >
                {{ rotuloStatus(atual) }}
              </span>
            </p>
          </div>
          <p class="font-mono text-[11.5px] leading-relaxed text-slate-500 sm:text-right">
            calculado em {{ formatarDataHora(atual.calculadoEm) }}<br />
            pkg_indicadores · Oracle
          </p>
        </div>

        <h2 class="mb-4 mt-6 font-display text-sm font-semibold text-white">Caminho até a origem</h2>
        <div class="grid grid-cols-1 items-start gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <!-- 1 · Entradas -->
          <div class="space-y-3">
            <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">1 · Dados de entrada</p>
            <div
              v-for="[papel, versao] in [[papeis.imovel, atual.versaoImovel], [papeis.insumo, atual.versaoInsumo]]"
              :key="papel"
              class="rounded-xl border border-indigo-500/30 bg-slate-950/40 p-3.5"
            >
              <p class="text-[11.5px] text-indigo-300">{{ papel }}</p>
              <template v-if="versao">
                <p class="mt-0.5 text-[13px] font-medium text-slate-100">{{ versao.fonteNome ?? versao.fonte ?? '—' }}</p>
                <p class="mt-1.5 truncate text-[11.5px] text-slate-400" :title="versao.arquivo">{{ versao.arquivo ?? '—' }}</p>
                <p class="font-mono text-[11px] text-slate-500">
                  {{ hashCurto(versao.hash) }} · {{ rotuloVersao(versao) }}
                </p>
                <p class="mt-1 font-mono text-[11px] text-cyan-400">
                  processado na execução #{{ versao.execucaoId ?? '—' }}
                  <span v-if="versao.processadoEm" class="text-slate-500">
                    · {{ formatarDataHora(versao.processadoEm) }}
                  </span>
                </p>
              </template>
              <p v-else class="mt-1 text-[12px] text-slate-500">Versão não encontrada.</p>
            </div>
          </div>

          <div class="grid place-items-center self-center text-slate-600">
            <AppIcon nome="seta" class="h-4 w-4 rotate-90 lg:rotate-0" />
          </div>

          <!-- 2 · Regra -->
          <div class="space-y-3">
            <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">2 · Regra aplicada</p>
            <div class="rounded-xl border border-indigo-500/30 bg-slate-950/40 p-3.5">
              <p class="font-mono text-[13px] font-medium text-indigo-300">
                {{ atual.regra.nome }} v{{ atual.regra.versao }}
              </p>
              <p class="font-mono text-[11px] text-slate-500">{{ atual.regra.codigo }}</p>
              <p class="mt-2 font-mono text-[11.5px] text-slate-300">{{ atual.regra.formula }}</p>
              <p class="mt-2 text-[12.5px] leading-relaxed text-slate-300">{{ atual.regra.descricao }}</p>
              <dl class="mt-2 space-y-0.5 text-[11.5px]">
                <div v-for="[nome, valor] in parametros" :key="nome" class="flex gap-2">
                  <dt class="text-slate-500">{{ nome }}:</dt>
                  <dd class="font-mono text-slate-300">{{ valor }}</dd>
                </div>
              </dl>
              <p class="mt-2 text-[11.5px] text-slate-500">
                A regra também é versionada: mudar a fórmula gera uma versão nova, e os resultados antigos
                continuam explicáveis.
              </p>
            </div>
          </div>

          <div class="grid place-items-center self-center text-slate-600">
            <AppIcon nome="seta" class="h-4 w-4 rotate-90 lg:rotate-0" />
          </div>

          <!-- 3 · Resultado -->
          <div class="space-y-3">
            <p class="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">3 · Resultado</p>
            <div class="rounded-xl border border-cyan-500/40 bg-cyan-500/[0.05] p-3.5">
              <p class="text-[13px] leading-relaxed text-slate-300">{{ conta }}</p>
              <p v-if="conclusao" :class="['mt-2 text-[12px]', conclusao.cor]">{{ conclusao.texto }}</p>
            </div>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <!-- O que mudou -->
        <BaseCard titulo="O que mudou desde o cálculo anterior" icone="atualizar">
          <p v-if="!anterior" class="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
            Este é o primeiro cálculo deste indicador para o imóvel.
          </p>
          <template v-else>
            <div class="overflow-x-auto rounded-xl border border-slate-800">
              <table class="w-full text-left text-sm">
                <thead class="bg-slate-900/80 text-[10.5px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th class="px-3 py-2.5 font-semibold">Campo</th>
                    <th class="px-3 py-2.5 font-semibold">{{ formatarDataHora(anterior.calculadoEm) }}</th>
                    <th class="px-3 py-2.5 font-semibold">{{ formatarDataHora(atual.calculadoEm) }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/80">
                  <tr v-for="linha in comparacao" :key="linha.campo" :class="linha.mudou && 'bg-amber-500/[0.06]'">
                    <td :class="['px-3 py-2.5 font-mono text-[12px]', linha.mudou ? 'text-amber-300' : 'text-slate-400']">
                      {{ linha.campo }}
                    </td>
                    <td :class="['px-3 py-2.5', linha.mudou ? 'text-slate-500 line-through decoration-slate-600' : 'text-slate-400']">
                      {{ linha.de }}
                    </td>
                    <td :class="['px-3 py-2.5', linha.mudou ? 'font-medium text-slate-100' : 'text-slate-400']">
                      {{ linha.para }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="motivoMudanca" class="mt-3 rounded-lg border border-cyan-500/30 bg-cyan-500/[0.06] p-3 text-[12.5px]">
              <p class="text-slate-400">
                <b class="text-slate-200">{{ motivoMudanca.dadoMudou ? 'Mudou o dado.' : 'O dado não mudou.' }}</b>
                <b class="ml-1 text-slate-200">{{ motivoMudanca.regraMudou ? 'Mudou a regra.' : 'A regra não mudou.' }}</b>
              </p>
            </div>
          </template>
        </BaseCard>

        <!-- Histórico -->
        <BaseCard titulo="Valor em cada cálculo" icone="tabela">
          <p class="mb-3 text-[12.5px] leading-relaxed text-slate-400">
            Cada combinação de versões dos dados e da regra guarda o próprio resultado. Nada é sobrescrito.
          </p>
          <div class="overflow-x-auto rounded-xl border border-slate-800">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-900/80 text-[10.5px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th class="px-3 py-2.5 font-semibold">Calculado em</th>
                  <th class="px-3 py-2.5 font-semibold">Dados</th>
                  <th class="px-3 py-2.5 font-semibold">Regra</th>
                  <th class="px-3 py-2.5 text-right font-semibold">{{ indicador }}</th>
                  <th class="px-3 py-2.5 font-semibold">Situação</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80">
                <tr v-for="(item, i) in historico" :key="item.calculadoEm" :class="i === 0 ? 'text-slate-100' : 'text-slate-400'">
                  <td class="whitespace-nowrap px-3 py-2.5 font-mono text-[12px]">
                    {{ formatarDataHora(item.calculadoEm) }}
                    <span v-if="i === 0" class="text-cyan-400">· atual</span>
                  </td>
                  <td class="px-3 py-2.5 text-[12px]">
                    {{ rotuloVersao(item.versaoImovel) }} · {{ rotuloVersao(item.versaoInsumo) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-2.5 font-mono text-[12px]">v{{ item.regra.versao }}</td>
                  <td class="px-3 py-2.5 text-right tabular-nums">{{ formatarValor(item) }}</td>
                  <td class="px-3 py-2.5">
                    <span
                      :class="['whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', coresStatus(item).etiqueta]"
                    >
                      {{ rotuloStatus(item) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
