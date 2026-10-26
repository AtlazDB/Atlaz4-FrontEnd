<script setup>
import { watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  aberto: { type: Boolean, default: false },
  titulo: { type: String, default: '' },
  sobre: { type: String, default: '' },
})

const emit = defineEmits(['fechar'])

function aoApertarTecla(evento) {
  if (evento.key === 'Escape') emit('fechar')
}

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
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div v-if="aberto" class="fixed inset-0 z-[1000]">
        <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" @click="$emit('fechar')" />

        <aside
          role="dialog"
          aria-modal="true"
          :aria-label="titulo"
          class="gaveta absolute right-0 top-0 flex h-full w-full max-w-[920px] flex-col
                 border-l border-slate-800 bg-slate-900/95 shadow-2xl"
        >
          <header class="flex items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
            <div class="min-w-0">
              <p v-if="sobre" class="truncate font-mono text-[11px] text-slate-500">{{ sobre }}</p>
              <h2 class="truncate font-display text-lg font-semibold text-white">{{ titulo }}</h2>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-lg border border-slate-700 px-2.5 py-1 text-sm text-slate-400
                     transition hover:border-slate-500 hover:text-slate-100"
              aria-label="Fechar"
              @click="$emit('fechar')"
            >
              ✕
            </button>
          </header>

          <div class="flex-1 overflow-y-auto px-5 py-5">
            <slot />
          </div>

          <footer
            v-if="$slots.rodape"
            class="flex flex-wrap items-center justify-end gap-2 border-t border-slate-800 px-5 py-3.5"
          >
            <slot name="rodape" />
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.gaveta {
  animation: entrar-gaveta 0.25s ease;
}

@keyframes entrar-gaveta {
  from {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .gaveta {
    animation: none;
  }
}
</style>
