<script setup>
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import MapeamentoPainel from '@/components/mapeamento/MapeamentoPainel.vue'

/**
 * Modal de mapeamento de colunas de uma fonte. O conteúdo (e a conversa com
 * o service) mora no MapeamentoPainel, que também é a aba "Mapeamento" da
 * página da fonte; aqui ele só ganha a moldura de modal.
 *
 * Uso:
 *   <ModalMapeamento :aberto="mapeando" :fonte="selecionada"
 *                    @fechar="mapeando = false" @alterado="..." />
 */
defineProps({
  aberto: { type: Boolean, default: false },
  /** a fonte inteira (precisa de id, sigla e nome) */
  fonte: { type: Object, default: null },
})

defineEmits(['fechar', 'alterado'])
</script>

<template>
  <BaseModal
    :aberto="aberto"
    :titulo="`Mapear colunas${fonte ? ' — ' + fonte.sigla : ''}`"
    descricao="Defina para onde vai cada coluna dos arquivos desta fonte e quais regras de qualidade valem para ela."
    @fechar="$emit('fechar')"
  >
    <MapeamentoPainel :fonte="fonte" :ativo="aberto" @alterado="$emit('alterado')" />

    <template #rodape>
      <BaseButton variante="fantasma" @click="$emit('fechar')">Fechar</BaseButton>
    </template>
  </BaseModal>
</template>
