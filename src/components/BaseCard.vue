<script setup>
/**
 * Cartão de vidro reutilizável — o contêiner padrão de qualquer bloco de
 * conteúdo da aplicação. Uso:
 *
 *   <BaseCard titulo="Fontes cadastradas" icone="camadas">
 *     <template #acoes><BaseButton tamanho="sm">+ Nova</BaseButton></template>
 *     conteúdo aqui
 *   </BaseCard>
 */
import AppIcon from '@/components/AppIcon.vue'

defineProps({
  titulo: { type: String, default: '' },
  descricao: { type: String, default: '' },
  icone: { type: String, default: '' },
  /** true no cartão principal da tela — só aumenta o título. */
  destaque: { type: Boolean, default: false },
  /** Classe de cor do ícone — ciano para dados, índigo para rastreabilidade. */
  corIcone: { type: String, default: 'text-cyan-400' },
})
</script>

<template>
  <section class="glass p-5">
    <header v-if="titulo || $slots.acoes" class="mb-4 flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h2
          class="flex items-center gap-2 font-display font-semibold text-white"
          :class="destaque ? 'text-lg' : 'text-sm'"
        >
          <AppIcon v-if="icone" :nome="icone" class="h-4 w-4 shrink-0" :class="corIcone" />
          {{ titulo }}
        </h2>
        <p v-if="descricao" class="mt-1.5 text-[13px] leading-relaxed text-slate-400">
          {{ descricao }}
        </p>
      </div>
      <div v-if="$slots.acoes" class="shrink-0">
        <slot name="acoes" />
      </div>
    </header>

    <slot />
  </section>
</template>
