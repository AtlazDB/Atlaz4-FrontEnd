import { createRouter, createWebHistory } from 'vue-router'
import ImportacaoView from '@/views/ImportacaoView.vue'

/**
 * Uma rota por etapa do fluxo de dados. A trilha do topo (EtapasNav) lê a
 * lista de etapas em src/router/etapas.js e liga cada uma ao `name` daqui.
 *
 * As telas de Validação e Padronização entram como novas rotas conforme
 * forem construídas — e o `rota: null` correspondente em etapas.js passa a
 * apontar para elas.
 */
const routes = [
  { path: '/', redirect: { name: 'importacao' } },
  {
    path: '/importacao',
    name: 'importacao',
    component: ImportacaoView,
  },
  // Qualquer endereço desconhecido volta para o começo do fluxo.
  { path: '/:caminho(.*)*', redirect: { name: 'importacao' } },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
