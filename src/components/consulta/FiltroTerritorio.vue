<script setup>
import BaseButton from '@/components/BaseButton.vue'

/**
 * Filtros da consulta, com dois v-model:
 *   v-model:cod-ibge   → código IBGE do município ('' = todos)
 *   v-model:cod-imovel → trecho do código do imóvel no CAR ('' = todos)
 */
defineProps({
  municipios: { type: Array, required: true },
  codIbge: { type: String, default: '' },
  codImovel: { type: String, default: '' },
  carregando: { type: Boolean, default: false },
  /** mensagem pronta, montada pela view */
  erro: { type: String, default: '' },
})

const emit = defineEmits(['update:codIbge', 'update:codImovel'])

function limpar() {
  emit('update:codIbge', '')
  emit('update:codImovel', '')
}
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <div class="w-full sm:w-72">
      <label class="label" for="filtro-municipio">Município (PR)</label>
      <select
        id="filtro-municipio"
        class="input"
        :value="codIbge"
        :disabled="carregando"
        @change="emit('update:codIbge', $event.target.value)"
      >
        <option value="">Todos os municípios ({{ municipios.length }})</option>
        <option v-for="municipio in municipios" :key="municipio.codIbge" :value="municipio.codIbge">
          {{ municipio.nome }}
        </option>
      </select>
    </div>

    <div class="w-full sm:w-80">
      <label class="label" for="filtro-codigo">Código do imóvel</label>
      <input
        id="filtro-codigo"
        type="search"
        class="input font-mono"
        placeholder="Ex.: PR-4106902-ABFE0C04…"
        autocomplete="off"
        :value="codImovel"
        @input="emit('update:codImovel', $event.target.value)"
      />
    </div>

    <BaseButton
      v-if="codIbge || codImovel"
      variante="fantasma"
      tamanho="sm"
      class="mb-0.5"
      @click="limpar"
    >
      Limpar filtro
    </BaseButton>

    <p v-if="erro" class="w-full text-xs text-red-300">{{ erro }}</p>
  </div>
</template>
