<script setup>
import BaseButton from '@/components/BaseButton.vue'

/**
 * Filtro por município. Usa v-model: o valor é o código IBGE escolhido, e
 * string vazia quer dizer "todos os municípios".
 */
defineProps({
  municipios: { type: Array, required: true },
  modelValue: { type: String, default: '' },
  carregando: { type: Boolean, default: false },
  erro: { type: String, default: '' },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <div class="w-full sm:w-80">
      <label class="label" for="filtro-municipio">Município (PR)</label>
      <select
        id="filtro-municipio"
        class="input"
        :value="modelValue"
        :disabled="carregando"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option value="">Todos os municípios ({{ municipios.length }})</option>
        <option v-for="municipio in municipios" :key="municipio.codIbge" :value="municipio.codIbge">
          {{ municipio.nome }}
        </option>
      </select>
    </div>

    <BaseButton
      v-if="modelValue"
      variante="fantasma"
      tamanho="sm"
      class="mb-0.5"
      @click="$emit('update:modelValue', '')"
    >
      Limpar filtro
    </BaseButton>

    <p v-if="erro" class="w-full text-xs text-red-300">
      Não deu para carregar a lista de municípios: {{ erro }}
    </p>
  </div>
</template>
