import { createRouter, createWebHistory } from 'vue-router'
import ImportacaoView from '@/views/ImportacaoView.vue'
import ConsultaView from '@/views/ConsultaView.vue'

/**
 * Uma rota por etapa do fluxo de dados. A trilha do topo (EtapasNav) lê a
 * lista de etapas em src/router/etapas.js e liga cada uma ao `name` daqui.
 *
 * As telas de Validação e Padronização entram como novas rotas conforme
 * forem construídas — e o `rota: null` correspondente em etapas.js passa a
 * apontar para elas.
 *
 * `meta.etapas` diz se a trilha aparece: ela é do fluxo do Operador de
 * Dados, e não faz sentido na consulta do Analista.
 */
const routes = [
  { path: '/', redirect: { name: 'importacao' } },
  {
    path: '/importacao',
    name: 'importacao',
    component: ImportacaoView,
    meta: { etapas: true },
  },
  {
    path: '/consulta',
    name: 'consulta',
    component: ConsultaView,
  },
  // Qualquer endereço desconhecido volta para o começo do fluxo.
  { path: '/:caminho(.*)*', redirect: { name: 'importacao' } },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
