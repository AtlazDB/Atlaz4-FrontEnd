<script setup>
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import EtapasNav from '@/components/layout/EtapasNav.vue'

const route = useRoute()
</script>

<template>
  <!-- Manchas de luz do fundo, atrás de todo o conteúdo. -->
  <div class="glow -left-40 -top-40 h-[520px] w-[520px] bg-cyan-500/10" />
  <div class="glow -right-52 top-1/3 h-[520px] w-[520px] bg-indigo-500/10" />
  <div class="glow bottom-0 left-1/4 h-[480px] w-[480px] bg-emerald-500/10" />

  <div class="relative z-10 mx-auto flex min-h-screen max-w-[1400px] flex-col px-4 py-6 md:px-6">
    <AppHeader class="mb-5" />
    <EtapasNav v-if="route.meta.etapas" class="mb-5" />

    <main class="flex-1">
      <!-- A tela da etapa atual entra aqui (ver src/router/index.js) -->
      <RouterView />
    </main>

    <AppFooter class="mt-6 pt-2" />
  </div>
</template>
