<script setup>
import { watch, onBeforeUnmount } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

/**
 * Janela modal reutilizável. Uso:
 *
 *   <BaseModal :aberto="aberto" titulo="Mapear colunas" @fechar="aberto = false">
 *     conteúdo
 *     <template #rodape><BaseButton>Salvar</BaseButton></template>
 *   </BaseModal>
 *
 * Fecha com Esc, com o X e clicando fora da janela. Não guarda estado:
 * quem abre e fecha é o pai, via `aberto` + evento 'fechar'.
 */
const props = defineProps({
  aberto: { type: Boolean, default: false },
  titulo: { type: String, default: '' },
  descricao: { type: String, default: '' },
  /** classe de largura máxima do Tailwind */
  largura: { type: String, default: 'max-w-4xl' },
})

const emit = defineEmits(['fechar'])

function aoApertarTecla(evento) {
  if (evento.key === 'Escape') emit('fechar')
}

// O listener só existe enquanto o modal está aberto.
watch(
  () => props.aberto,
  (sim) => {
    if (sim) window.addEventListener('keydown', aoApertarTecla)
    else window.removeEventListener('keydown', aoApertarTecla)
  },
  { immediate: true },
)

onBeforeUnmount(() => window.removeEventListener('keydown', aoApertarTecla))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="aberto"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto
               bg-slate-950/80 p-4 backdrop-blur-sm sm:p-8"
        @mousedown.self="$emit('fechar')"
      >
        <section
          role="dialog"
          aria-modal="true"
          :aria-label="titulo"
          :class="['glass w-full bg-slate-900/95 p-5', largura]"
        >
          <header class="mb-4 flex items-start justify-between gap-4">
            <div class="min-w-0">
              <h2 class="font-display text-lg font-semibold text-white">{{ titulo }}</h2>
              <p v-if="descricao" class="mt-1.5 text-[13px] leading-relaxed text-slate-400">
                {{ descricao }}
              </p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-slate-700 px-2.5 py-1 text-sm
                     text-slate-400 transition hover:border-slate-500 hover:text-slate-100"
              aria-label="Fechar"
              @click="$emit('fechar')"
            >
              ✕
            </button>
          </header>

          <slot />

          <footer v-if="$slots.rodape" class="mt-5 flex justify-end gap-2 border-t border-slate-800 pt-4">
            <slot name="rodape" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>