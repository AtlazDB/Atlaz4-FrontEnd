<script setup>
import { ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'

defineProps({
  salvando: { type: Boolean, default: false },
})

const emit = defineEmits(['salvar', 'cancelar', 'testar-link'])

const form = ref({
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
  cron: ''
})

const formatos = ['CSV', 'GeoJSON', 'SHP', 'XLSX', 'JSON']
const periodicidades = ['diária', 'semanal', 'mensal', 'anual', 'eventual']

function limpar() {
  form.value = {
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
    cron: ''
  }
}

function submeter() {
  emit('salvar', { ...form.value })
}

function dispararTesteLink() {
  emit('testar-link', { ...form.value })
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
        <label class="label" for="modalidade">Modalidade de Ingestão</label>
        <select id="modalidade" v-model="form.modalidade" class="input font-semibold">
          <option value="MANUAL">Manual (Upload)</option>
          <option value="LINK">Link (Automatizada)</option>
        </select>
      </div>
    </div>

    <!-- Seção condicional para Fontes por Link (Task T1) -->
    <div v-if="form.modalidade === 'LINK'" class="p-3 border border-emerald-500/30 rounded-lg space-y-3 bg-emerald-500/5">
      <div class="text-xs font-semibold uppercase tracking-wider text-emerald-600">Configuração de Ingestão por Link</div>
      
      <div>
        <label class="label" for="urlOrigem">URL de Origem</label>
        <div class="flex gap-2">
          <input
            id="urlOrigem"
            v-model="form.urlOrigem"
            class="input flex-1"
            placeholder="https://api.orgao.gov.br/dados.csv"
            :required="form.modalidade === 'LINK'"
          />
          <BaseButton type="button" variante="secundaria" @click="dispararTesteLink">
            Testar Link
          </BaseButton>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="label" for="metodoHttp">Método HTTP</label>
          <select id="metodoHttp" v-model="form.metodoHttp" class="input">
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </div>
        <div>
          <label class="label" for="cron">Agendamento CRON</label>
          <input
            id="cron"
            v-model="form.cron"
            class="input font-mono"
            placeholder="0 0 * * *"
          />
        </div>
      </div>

      <div>
        <label class="label" for="cabecalhos">Cabeçalhos HTTP (JSON opcional)</label>
        <textarea
          id="cabecalhos"
          v-model="form.cabecalhos"
          class="input font-mono text-xs"
          rows="2"
          placeholder='{"Authorization": "Bearer token123"}'
        ></textarea>
      </div>

      <div v-if="form.metodoHttp === 'POST'">
        <label class="label" for="corpoRequisicao">Corpo da Requisição (Payload POST)</label>
        <textarea
          id="corpoRequisicao"
          v-model="form.corpoRequisicao"
          class="input font-mono text-xs"
          rows="2"
          placeholder='{"query": "select * from..."}'
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