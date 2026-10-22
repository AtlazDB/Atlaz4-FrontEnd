<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div class="bg-[#161b22] border border-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-gray-200">
      
      <!-- Cabeçalho do Modal -->
      <div class="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#0d1117]">
        <div>
          <h3 class="text-lg font-semibold text-white">Detalhes do Registro #{{ registro?.id }}</h3>
          <p class="text-xs text-gray-400">Entidade: <span class="text-cyan-400">{{ registro?.entidade }}</span> | Chave: {{ registro?.chaveNatural }}</p>
        </div>
        <button @click="$emit('close')" class="text-gray-400 hover:text-white text-xl font-bold">&times;</button>
      </div>

      <!-- Corpo do Modal -->
      <div class="p-6 overflow-y-auto space-y-6 flex-1">
        
        <!-- Informações do Erro -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0d1117] p-4 rounded-lg border border-gray-800">
          <div>
            <span class="text-xs text-gray-400 block">Tipo de Erro:</span>
            <span class="text-sm font-medium text-red-400">{{ registro?.tipoErro }}</span>
          </div>
          <div>
            <span class="text-xs text-gray-400 block">Status Atual:</span>
            <span class="text-sm font-medium text-yellow-400">{{ registro?.statusAnalise }}</span>
          </div>
          <div class="md:col-span-2">
            <span class="text-xs text-gray-400 block mb-1">Valor Recebido / Motivo:</span>
            <div class="bg-black/40 p-2 rounded text-xs font-mono text-gray-300 max-h-24 overflow-y-auto">
              {{ registro?.valorRecebido }}
            </div>
          </div>
        </div>

        <!-- T6-07: Mapa Leaflet & Geometria -->
        <div class="space-y-2">
          <h4 class="text-sm font-semibold text-gray-300">Visualização Espacial do Erro</h4>
          <div id="mapa-quarentena" class="w-full h-64 rounded-lg border border-gray-800 z-10"></div>
        </div>

        <!-- Editor de Correção & Justificativa -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs text-gray-400">Payload Corrigido (JSON):</label>
            <textarea v-model="payloadCorrigido" rows="5" class="w-full bg-black/40 border border-gray-800 rounded p-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"></textarea>
          </div>
          <div class="space-y-1">
            <label class="text-xs text-gray-400">Justificativa (Obrigatória para Descarte):</label>
            <textarea v-model="justificativa" rows="5" placeholder="Informe o motivo da ação..." class="w-full bg-black/40 border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-cyan-500"></textarea>
          </div>
        </div>

      </div>

      <!-- Rodapé com Botões de Ação -->
      <div class="px-6 py-4 border-t border-gray-800 bg-[#0d1117] flex flex-wrap justify-end gap-3">
        <button @click="executarAcao('iniciar')" class="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded text-xs font-semibold transition">Iniciar Análise</button>
        <button @click="executarAcao('corrigir')" class="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 rounded text-xs font-semibold transition">Salvar Correção</button>
        <button @click="executarAcao('descartar')" class="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded text-xs font-semibold transition">Descartar</button>
        <button @click="executarAcao('revalidar')" class="px-4 py-2 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-500 transition">Revalidar (Procedure)</button>
      </div>

    </div>
  </div>
</template>

<script>
import { ref, watch, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import quarentenaService from '@/services/quarentenaService';
import QuarentenaModal from '@/components/quarentena/QuarentenaModal.vue';

export default {
  props: {
    isOpen: Boolean,
    registroId: [Number, String]
  },
  emits: ['close', 'atualizado'],
  setup(props, { emit }) {
    const registro = ref(null);
    const payloadCorrigido = ref('');
    const justificativa = ref('');
    let map = null;

    watch(() => props.isOpen, async (newVal) => {
      if (newVal && props.registroId) {
        const { data } = await quarentenaService.obterPorId(props.registroId);
        registro.value = data;
        payloadCorrigido.value = data.payloadCorrigido || data.payload || '';
        
        await nextTick();
        inicializarMapa(data);
      }
    });

    function inicializarMapa(data) {
      if (map) {
        map.remove();
        map = null;
      }

      map = L.map('mapa-quarentena').setView([-25.4284, -49.2733], 13); // Centro de Curitiba como referência
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB'
      }).addTo(map);

      // Se houver geometria associada, renderiza no mapa (exemplo genérico de ponto/polígono)
      if (data.geometria) {
        try {
          // Adiciona marcador de erro em destaque vermelho
          L.circleMarker([-25.4284, -49.2733], {
            radius: 8,
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.8
          }).addTo(map).bindPopup(`<b>Erro:</b> ${data.tipoErro}`).openPopup();
        } catch (e) {
          console.error('Erro ao renderizar geometria no mapa', e);
        }
      }
    }

    async function executarAcao(tipo) {
      try {
        if (tipo === 'iniciar') await quarentenaService.iniciarAnalise(registro.value.id);
        if (tipo === 'corrigir') await quarentenaService.corrigir(registro.value.id, payloadCorrigido.value);
        if (tipo === 'descartar') {
          if (!justificativa.value) {
            alert('A justificativa é obrigatória para descartar o registro.');
            return;
          }
          await quarentenaService.descartar(registro.value.id, justificativa.value);
        }
        if (tipo === 'revalidar') await quarentenaService.revalidar(registro.value.id);

        alert('Ação executada com sucesso!');
        emit('atualizado');
        emit('close');
      } catch (error) {
        alert('Erro ao executar ação: ' + (error.response?.data?.message || error.message));
      }
    }

    return { registro, payloadCorrigido, justificativa, executarAcao };
  }
};
</script>