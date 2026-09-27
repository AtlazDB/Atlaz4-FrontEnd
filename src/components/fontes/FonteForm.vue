<script setup>
import { ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'

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
 */

defineProps({
  salvando: { type: Boolean, default: false },
})

const emit = defineEmits(['salvar', 'cancelar'])

const form = ref({
  nome: '',
  sigla: '',
  orgao: '',
  formato: 'CSV',
  periodicidade: 'mensal',
})

const formatos = ['CSV', 'GeoJSON', 'SHP', 'XLSX', 'JSON']
const periodicidades = ['diária', 'semanal', 'mensal', 'anual', 'eventual']

function limpar() {
  form.value = { nome: '', sigla: '', orgao: '', formato: 'CSV', periodicidade: 'mensal' }
}

function submeter() {
  emit('salvar', { ...form.value })
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

    <div>
      <label class="label" for="periodicidade">Periodicidade de atualização</label>
      <select id="periodicidade" v-model="form.periodicidade" class="input">
        <option v-for="p in periodicidades" :key="p" :value="p">{{ p }}</option>
      </select>
    </div>

    <div class="flex items-center gap-2 pt-1">
      <BaseButton class="flex-1" type="button" variante="fantasma" @click="$emit('cancelar')">
        Cancelar
      </BaseButton>
      <BaseButton class="flex-1" type="submit" :carregando="salvando">Cadastrar fonte</BaseButton>
    </div>
  </form>
</template>
