<script setup>
import { ref, watch } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import ColunasDetectadas from '@/components/mapeamento/ColunasDetectadas.vue'
import { listarColunas } from '@/services/mapeamentosService'

/**
 * Modal de mapeamento de colunas de uma fonte.
 *
 * Aqui o modal é o "cérebro" do mapeamento (papel que a ImportacaoView tem
 * na tela de importação): ele carrega os dados e distribui por props para
 * os filhos de apresentação. Assim a ImportacaoView só abre e fecha.
 *
 * Uso:
 *   <ModalMapeamento :aberto="mapeando" :fonte="selecionada" @fechar="mapeando = false" />
 */
const props = defineProps({
  aberto: { type: Boolean, default: false },
  /** a fonte inteira (precisa de id, sigla e nome) */
  fonte: { type: Object, default: null },
})

defineEmits(['fechar'])

const colunas = ref([])
const carregando = ref(false)
const erro = ref('')

async function carregar() {
  if (!props.fonte) return
  carregando.value = true
  erro.value = ''
  try {
    colunas.value = await listarColunas(props.fonte.id)
  } catch (e) {
    colunas.value = []
    erro.value = e.message
  } finally {
    carregando.value = false
  }
}

// Recarrega toda vez que o modal abre (ou troca de fonte com ele aberto),
// para nunca mostrar colunas de outra fonte.
watch(
  () => [props.aberto, props.fonte?.id],
  ([aberto]) => {
    if (aberto) carregar()
  },
  { immediate: true },
)
</script>

<template>
  <BaseModal
    :aberto="aberto"
    :titulo="`Mapear colunas${fonte ? ' — ' + fonte.sigla : ''}`"
    descricao="Defina para onde vai cada coluna dos arquivos desta fonte e quais regras de qualidade valem para ela."
    @fechar="$emit('fechar')"
  >
    <h3 class="mb-3 text-sm font-semibold text-white">Colunas detectadas</h3>
    <ColunasDetectadas
      :colunas="colunas"
      :carregando="carregando"
      :erro="erro"
      @tentar-novamente="carregar"
    />

    <template #rodape>
      <BaseButton variante="fantasma" @click="$emit('fechar')">Fechar</BaseButton>
    </template>
  </BaseModal>
</template>