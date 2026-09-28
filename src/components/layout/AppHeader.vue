<script setup>
import { useRoute } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'

/**
 * Barra superior fixa da aplicação: marca à esquerda, navegação à direita.
 *
 * O bloco do usuário está comentado: ainda não existe login nem separação
 * por perfil. Quando existir, descomente o `usuario`, as `iniciais` e o
 * bloco no final do template.
 */
// const usuario = { nome: 'Usuário', perfil: 'Operador de Dados' }
//
// const iniciais = usuario.nome
//   .split(' ')
//   .map((parte) => parte[0])
//   .join('')
//   .slice(0, 2)
//   .toUpperCase()

const route = useRoute()

const areas = [
  { rota: 'importacao', rotulo: 'Ingestão de dados' },
  { rota: 'consulta', rotulo: 'Consulta territorial' },
]
</script>

<template>
  <header class="glass flex flex-wrap items-center justify-between gap-4 px-5 py-3.5">
    <div class="flex items-center gap-3">
      <div
        class="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br
               from-cyan-400 via-emerald-400 to-indigo-500 shadow-lg shadow-cyan-500/20"
      >
        <AppIcon nome="local" traco="2.4" class="h-5 w-5 text-slate-950" />
      </div>
      <h1 class="font-display text-lg font-semibold tracking-tight text-white">
        GeoRural DataHub
      </h1>
    </div>

    <nav
      class="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/40 p-1"
      aria-label="Áreas da aplicação"
    >
      <RouterLink
        v-for="area in areas"
        :key="area.rota"
        :to="{ name: area.rota }"
        class="rounded-lg px-3 py-1.5 text-[13px] font-medium transition"
        :class="
          route.name === area.rota
            ? 'bg-cyan-500/15 text-cyan-300'
            : 'text-slate-400 hover:text-slate-200'
        "
      >
        {{ area.rotulo }}
      </RouterLink>
    </nav>

    <!-- Usuário: comentado até existir login e separação por perfil.
    <div class="flex items-center gap-2.5 border-l border-slate-700/70 pl-3">
      <div
        class="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500
               font-display text-xs font-semibold text-white"
      >
        {{ iniciais }}
      </div>
      <div class="leading-tight">
        <p class="text-sm font-medium text-slate-100">{{ usuario.nome }}</p>
        <p class="text-[11px] text-slate-400">Perfil: {{ usuario.perfil }}</p>
      </div>
    </div>
    -->
  </header>
</template>
