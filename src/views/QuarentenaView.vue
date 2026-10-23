


<template>
    
  <div class="min-h-screen bg-[#0d1117] text-gray-200 p-6">
    
    <!-- Cabeçalho da Página -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white">Gestão de Quarentena</h1>
      <p class="text-sm text-gray-400">Monitore, filtre e trate inconsistências e erros de ingestão espacial e cadastral.</p>
    </div>

    <!-- Cards de Métricas (Clicáveis) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div @click="filtrarPorStatus('PENDENTE')" class="bg-[#161b22] border border-gray-800 p-4 rounded-xl cursor-pointer hover:border-yellow-500/50 transition">
        <span class="text-xs text-gray-400">Pendentes</span>
        <h3 class="text-2xl font-bold text-yellow-400 mt-1">{{ metricas.pendentes || 0 }}</h3>
      </div>
      <div @click="filtrarPorStatus('EM_ANALISE')" class="bg-[#161b22] border border-gray-800 p-4 rounded-xl cursor-pointer hover:border-blue-500/50 transition">
        <span class="text-xs text-gray-400">Em Análise</span>
        <h3 class="text-2xl font-bold text-blue-400 mt-1">{{ metricas.emAnalise || 0 }}</h3>
      </div>
      <div @click="filtrarPorStatus('REVALIDADO')" class="bg-[#161b22] border border-gray-800 p-4 rounded-xl cursor-pointer hover:border-emerald-500/50 transition">
        <span class="text-xs text-gray-400">Revalidados</span>
        <h3 class="text-2xl font-bold text-emerald-400 mt-1">{{ metricas.revalidados || 0 }}</h3>
      </div>
      <div @click="filtrarPorStatus('DESCARTADO')" class="bg-[#161b22] border border-gray-800 p-4 rounded-xl cursor-pointer hover:border-red-500/50 transition">
        <span class="text-xs text-gray-400">Descartados</span>
        <h3 class="text-2xl font-bold text-red-400 mt-1">{{ metricas.descartados || 0 }}</h3>
      </div>
    </div>

    <!-- Barra de Filtros -->
    <div class="bg-[#161b22] border border-gray-800 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <input v-model="filtros.busca" @input="carregarRegistros" placeholder="Buscar por chave natural..." class="bg-black/40 border border-gray-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
      <select v-model="filtros.tipoErro" @change="carregarRegistros" class="bg-black/40 border border-gray-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
        <option value="">Todos os Tipos de Erro</option>
        <option value="GEOMETRIA_INVALIDA">Geometria Inválida</option>
        <option value="CODIGO_AUSENTE">Código Ausente</option>
      </select>
      <select v-model="filtros.status" @change="carregarRegistros" class="bg-black/40 border border-gray-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
        <option value="">Todos os Status</option>
        <option value="PENDENTE">Pendente</option>
        <option value="EM_ANALISE">Em Análise</option>
        <option value="CORRIGIDO">Corrigido</option>
        <option value="REVALIDADO">Revalidado</option>
        <option value="DESCARTADO">Descartado</option>
        <option value="SUBSTITUIDO">Substituído por carga mais nova</option>
      </select>
      <button @click="limparFiltros" class="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold rounded px-4 py-2 transition">Limpar Filtros</button>
    </div>

    <!-- Tabela de Registros -->
    <div class="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-800 bg-[#0d1117] text-xs text-gray-400">
            <th class="p-4">ID</th>
            <th class="p-4">Entidade</th>
            <th class="p-4">Chave Natural</th>
            <th class="p-4">Tipo de Erro</th>
            <th class="p-4">Status</th>
            <th class="p-4 text-right">Ação</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-800 text-sm">
          <tr v-for="reg in registros" :key="reg.id" class="hover:bg-white/[0.02] transition">
            <td class="p-4 font-mono text-xs text-gray-400">#{{ reg.id }}</td>
            <td class="p-4 text-white font-medium">{{ reg.entidade }}</td>
            <td class="p-4 text-gray-300">{{ reg.chaveNatural }}</td>
            <td class="p-4 text-red-400 text-xs">{{ reg.tipoErro }}</td>
            <td class="p-4">
              <span class="px-2 py-1 rounded text-xs font-semibold" :class="statusBadge(reg.statusAnalise)">
                {{ reg.statusAnalise }}
              </span>
            </td>
            <td class="p-4 text-right">
              <button @click="abrirDetalhes(reg.id)" class="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 rounded text-xs font-semibold transition">Analisar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de Detalhes -->
    <QuarentenaModal :is-open="modalAberto" :registro-id="registroSelecionado" @close="modalAberto = false" @atualizado="carregarDados" />

  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import quarentenaService from '@/services/quarentenaService';
import QuarentenaModal from '@/components/quarentena/QuarentenaModal.vue';

export default {
  components: { QuarentenaModal },
  setup() {
    const registros = ref([]);
    const metricas = ref({});
    const filtros = ref({ busca: '', tipoErro: '', status: '' });
    const modalAberto = ref(false);
    const registroSelecionado = ref(null);

    async function carregarRegistros() {
      try {
        const { data } = await quarentenaService.listar(filtros.value);
        registros.value = data.content || data; // Ajustar conforme paginação do back
      } catch (e) {
        console.error('Erro ao buscar registros', e);
      }
    }

    async function carregarMetricas() {
      try {
        const { data } = await quarentenaService.obterMetricas();
        metricas.value = data;
      } catch (e) {
        console.error('Erro ao buscar métricas', e);
      }
    }

    function carregarDados() {
      carregarRegistros();
      carregarMetricas();
    }

    function filtrarPorStatus(status) {
      filtros.value.status = filtros.value.status === status ? '' : status;
      carregarRegistros();
    }

    function limparFiltros() {
      filtros.value = { busca: '', tipoErro: '', status: '' };
      carregarRegistros();
    }

    function abrirDetalhes(id) {
      registroSelecionado.value = id;
      modalAberto.value = true;
    }

    function statusBadge(status) {
      switch (status) {
        case 'PENDENTE': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
        case 'EM_ANALISE': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
        case 'REVALIDADO': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        case 'CORRIGIDO': return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
        // Encerrado sem ação do operador: uma carga mais nova tratou o registro de novo
        case 'SUBSTITUIDO': return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
        default: return 'bg-red-500/10 text-red-400 border border-red-500/20';
      }
    }

    onMounted(() => {
      carregarDados();
    });

    return { registros, metricas, filtros, modalAberto, registroSelecionado, carregarRegistros, carregarDados, filtrarPorStatus, limparFiltros, abrirDetalhes, statusBadge };
  }
};
</script>