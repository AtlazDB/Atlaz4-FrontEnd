<script setup>
import { ref, computed, watch } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import { formatarNumero } from '@/utils/formato'

/**
 * ==================================================================
 * TODO 4 — Formulário de cadastro de fonte
 * ==================================================================
 * O template abaixo já está pronto e ligado ao objeto `form` por
 * v-model. Falta só o `submeter()`.
 *
 * Repare no padrão: este componente NÃO chama o service. Ele só emite
 * o evento 'salvar' com os dados; quem conversa com a API é a
 * ImportacaoView. Assim o formulário continua reaproveitável mesmo que a
 * origem dos dados mude.
 *
 * Fonte por link: com a modalidade "Link", aparecem o endereço, o método
 * e os cabeçalhos. O botão "Testar link" segue o mesmo padrão: emite
 * 'testar-link' com os dados do formulário, e a ImportacaoView devolve o
 * resultado pela prop `teste` (ou o erro por `erroTeste`).
 */

defineProps({
  salvando: { type: Boolean, default: false },
  testando: { type: Boolean, default: false },
  /** resposta do "Testar link": { mensagem, total, limitePorPedido, colunas, avisos } */
  teste: { type: Object, default: null },
  erroTeste: { type: String, default: '' },
})

const emit = defineEmits(['salvar', 'cancelar', 'testar-link', 'limpar-teste'])

const vazio = () => ({
  nome: '',
  sigla: '',
  orgao: '',
  formato: 'CSV',
  periodicidade: 'mensal',
  modalidade: 'MANUAL',
  urlOrigem: '',
  metodoHttp: 'GET',
  cabecalhos: '',
  corpoRequisicao: '',
})

const form = ref(vazio())

const formatos = ['CSV', 'GeoJSON', 'SHP', 'XLSX', 'JSON']
const periodicidades = ['diária', 'semanal', 'mensal', 'anual', 'eventual']

const porLink = computed(() => form.value.modalidade === 'LINK')

// Mudou o link: o resultado do teste anterior não vale mais.
watch(
  () => [form.value.urlOrigem, form.value.metodoHttp],
  () => emit('limpar-teste'),
)

function limpar() {
  form.value = vazio()
}

function submeter() {
  const dados = { ...form.value }
  if (!porLink.value) {
    // Fonte por upload: os campos de link não vão para o back.
    Object.assign(dados, { urlOrigem: null, metodoHttp: null, cabecalhos: null, corpoRequisicao: null })
  }
  emit('salvar', dados)
}

function testar() {
  const { urlOrigem, metodoHttp, cabecalhos, corpoRequisicao } = form.value
  emit('testar-link', { urlOrigem, metodoHttp, cabecalhos, corpoRequisicao })
}

// Deixa limpar() acessível pelo pai via ref do componente.
defineExpose({ limpar })
</script>

<template>
  <form class="space-y-3" @submit.prevent="submeter">
    <div>
      <label class="label" for="nome">Nome da fonte</label>
      <input
        id="nome"
        v-model="form.nome"
        class="input"
        placeholder="CAR — Cadastro Ambiental Rural"
        required
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label" for="sigla">Sigla</label>
        <input
          id="sigla"
          v-model="form.sigla"
          class="input font-mono uppercase"
          placeholder="CAR"
          maxlength="12"
          required
        />
      </div>
      <div>
        <label class="label" for="formato">Formato</label>
        <select id="formato" v-model="form.formato" class="input">
          <option v-for="f in formatos" :key="f" :value="f">{{ f }}</option>
        </select>
      </div>
    </div>

    <div>
      <label class="label" for="orgao">Órgão responsável</label>
      <input
        id="orgao"
        v-model="form.orgao"
        class="input"
        placeholder="Serviço Florestal Brasileiro"
        required
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label" for="periodicidade">Periodicidade</label>
        <select id="periodicidade" v-model="form.periodicidade" class="input">
          <option v-for="p in periodicidades" :key="p" :value="p">{{ p }}</option>
        </select>
      </div>
      <div>
        <label class="label" for="modalidade">Como os dados chegam</label>
        <select id="modalidade" v-model="form.modalidade" class="input">
          <option value="MANUAL">Envio de arquivo</option>
          <option value="LINK">Link (coleta)</option>
        </select>
      </div>
    </div>

    <!-- Fonte por link: endereço, método e cabeçalhos -->
    <div v-if="porLink" class="space-y-3 rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-3">
      <div>
        <label class="label" for="urlOrigem">Link de origem</label>
        <div class="flex gap-2">
          <input
            id="urlOrigem"
            v-model.trim="form.urlOrigem"
            class="input min-w-0 flex-1 font-mono text-xs"
            placeholder="https://geoserver.car.gov.br/geoserver/sicar/ows?service=WFS&..."
            required
          />
          <BaseButton
            type="button"
            variante="secundario"
            tamanho="sm"
            :carregando="testando"
            :disabled="!form.urlOrigem"
            @click="testar"
          >
            Testar link
          </BaseButton>
        </div>
        <p class="mt-1 text-[11px] text-slate-500">
          Serviço ArcGIS, WFS (GeoServer) ou um arquivo para baixar (zip, CSV, GeoJSON).
        </p>
      </div>

      <!-- Resultado do teste -->
      <div
        v-if="erroTeste"
        class="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300"
      >
        {{ erroTeste }}
      </div>
      <div
        v-else-if="teste"
        class="space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs"
      >
        <p class="font-medium text-emerald-300">{{ teste.mensagem }}</p>
        <p v-if="teste.limitePorPedido" class="text-slate-400">
          Até {{ formatarNumero(teste.limitePorPedido) }} registros por pedido.
        </p>
        <div v-if="teste.colunas?.length" class="flex flex-wrap gap-1">
          <span
            v-for="coluna in teste.colunas"
            :key="coluna"
            class="rounded border border-slate-700 bg-slate-950/40 px-1.5 py-0.5 font-mono text-[10.5px] text-slate-300"
          >
            {{ coluna }}
          </span>
        </div>
        <p
          v-for="aviso in teste.avisos"
          :key="aviso"
          class="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-300"
        >
          {{ aviso }}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label" for="metodoHttp">Método</label>
          <select id="metodoHttp" v-model="form.metodoHttp" class="input">
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </div>
        <div>
          <label class="label" for="cabecalhos">Cabeçalhos (JSON, opcional)</label>
          <input
            id="cabecalhos"
            v-model.trim="form.cabecalhos"
            class="input font-mono text-xs"
            placeholder='{"Accept": "application/json"}'
          />
        </div>
      </div>
      <p class="text-[11px] text-slate-500">
        Não coloque senha nem token nos cabeçalhos: eles ficam gravados junto com a fonte.
      </p>

      <div v-if="form.metodoHttp === 'POST'">
        <label class="label" for="corpoRequisicao">Corpo da requisição</label>
        <textarea
          id="corpoRequisicao"
          v-model="form.corpoRequisicao"
          class="input font-mono text-xs"
          rows="3"
        ></textarea>
      </div>
    </div>

    <div class="flex items-center gap-2 pt-1">
      <BaseButton class="flex-1" type="button" variante="fantasma" @click="$emit('cancelar')">
        Cancelar
      </BaseButton>
      <BaseButton class="flex-1" type="submit" :carregando="salvando">Cadastrar fonte</BaseButton>
    </div>
  </form>
</template>
