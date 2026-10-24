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
            <span class="text-xs text-gray-400 block mb-1">Motivo{{ registro?.campo ? ` (campo ${registro.campo})` : '' }}:</span>
            <div class="bg-black/40 p-2 rounded text-xs font-mono text-gray-300 max-h-24 overflow-y-auto">
              {{ registro?.motivo || '-' }}
            </div>
          </div>
          <div class="md:col-span-2">
            <span class="text-xs text-gray-400 block mb-1">Valor Recebido:</span>
            <div class="bg-black/40 p-2 rounded text-xs font-mono text-gray-300 max-h-24 overflow-y-auto">
              {{ registro?.valorRecebido || '(vazio)' }}
            </div>
          </div>
        </div>

        <!-- T6-07: Mapa Leaflet & Geometria -->
        <div class="space-y-2">
          <h4 class="text-sm font-semibold text-gray-300">Visualização Espacial do Erro</h4>
          <div id="mapa-quarentena" class="w-full h-64 rounded-lg border border-gray-800 z-10"></div>
          <p v-if="semGeometria" class="text-xs text-gray-400">Este registro não tem geometria para exibir.</p>
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

        <!-- Revalidação reprovada: o registro continua na quarentena com estes erros -->
        <div v-if="errosRevalidacao.length" ref="quadroErros" class="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-2">
          <h4 class="text-sm font-semibold text-red-400">Revalidação reprovada: o registro continua na quarentena</h4>
          <ul class="space-y-1 text-xs text-gray-300">
            <li v-for="(erro, i) in errosRevalidacao" :key="i">
              <span class="font-semibold text-red-400">{{ erro.tipo_erro }}</span>
              <span v-if="erro.campo"> · campo {{ erro.campo }}</span>
              <span>: {{ erro.motivo }}</span>
              <span v-if="erro.valor_recebido" class="font-mono text-gray-400"> (recebido: {{ erro.valor_recebido }})</span>
            </li>
          </ul>
        </div>

      </div>

      <!-- Rodapé com Botões de Ação -->
      <div class="px-6 py-4 border-t border-gray-800 bg-[#0d1117] flex flex-wrap justify-end items-center gap-3">
        <span v-if="encerrado" class="text-xs text-gray-400">Registro encerrado ({{ registro?.statusAnalise }}): nenhuma ação disponível.</span>
        <template v-else>
          <button v-if="registro?.statusAnalise === 'PENDENTE'" @click="executarAcao('iniciar')" class="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded text-xs font-semibold transition">Iniciar Análise</button>
          <button @click="executarAcao('corrigir')" class="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 rounded text-xs font-semibold transition">Salvar Correção</button>
          <button @click="executarAcao('descartar')" class="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded text-xs font-semibold transition">Descartar</button>
          <button @click="executarAcao('revalidar')" class="px-4 py-2 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-500 transition">Revalidar (Procedure)</button>
        </template>
      </div>

    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import quarentenaService from '@/services/quarentenaService';

// Status em que a análise já acabou: o back recusa qualquer ação (409).
const STATUS_ENCERRADOS = ['DESCARTADO', 'REVALIDADO', 'SUBSTITUIDO'];

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
    const semGeometria = ref(false);
    const errosRevalidacao = ref([]);
    const quadroErros = ref(null);
    const encerrado = computed(() => STATUS_ENCERRADOS.includes(registro.value?.statusAnalise));
    let map = null;

    watch(() => props.isOpen, async (newVal) => {
      if (newVal && props.registroId) {
        const { data } = await quarentenaService.obterPorId(props.registroId);
        registro.value = data;
        payloadCorrigido.value = data.payloadCorrigido || data.payload || '';
        justificativa.value = '';
        errosRevalidacao.value = [];

        // A geometria não vem no registro: o back serve à parte, já em GeoJSON.
        let geojson = null;
        try {
          const resposta = await quarentenaService.obterGeometria(props.registroId);
          geojson = resposta.status === 204 ? null : resposta.data;
        } catch (e) {
          console.error('Erro ao buscar geometria do registro', e);
        }
        semGeometria.value = !geojson;

        await nextTick();
        inicializarMapa(data, geojson);
      }
    });

    function inicializarMapa(data, geojson) {
      if (map) {
        map.remove();
        map = null;
      }

      map = L.map('mapa-quarentena').setView([-25.4284, -49.2733], 7); // Paraná como referência quando não há geometria
      // Mesmo fundo do mapa da consulta: o CartoDB passou a exigir chave de API.
      const esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas';
      L.tileLayer(`${esri}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
        attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap',
        maxZoom: 16 // o fundo da Esri não tem tiles além disso
      }).addTo(map);
      L.tileLayer(`${esri}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, {
        maxZoom: 16
      }).addTo(map);

      if (!geojson) return;

      try {
        // Destaque vermelho; pontos viram círculo para não depender do ícone padrão do Leaflet.
        const camada = L.geoJSON(geojson, {
          style: { color: '#ef4444', weight: 2, fillColor: '#ef4444', fillOpacity: 0.3 },
          pointToLayer: (_, latlng) => L.circleMarker(latlng, {
            radius: 8,
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.8
          })
        }).addTo(map);

        camada.bindPopup(`<b>Erro:</b> ${data.tipoErro || data.motivo || '-'}`);
        map.fitBounds(camada.getBounds(), { padding: [20, 20], maxZoom: 16 });
      } catch (e) {
        console.error('Erro ao renderizar geometria no mapa', e);
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
        if (tipo === 'revalidar') {
          // Reprovar vem como 200 com status REPROVADO: o modal fica aberto e mostra os erros.
          const { data } = await quarentenaService.revalidar(registro.value.id);
          if (data.status !== 'APROVADO') {
            errosRevalidacao.value = data.erros || [];
            if (data.quarantine) registro.value = data.quarantine;
            emit('atualizado');
            // O quadro fica no fim do modal: rola até ele para o operador ver o resultado.
            await nextTick();
            quadroErros.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }

        alert('Ação executada com sucesso!');
        emit('atualizado');
        emit('close');
      } catch (error) {
        // O http.js já transforma a resposta de erro do back em error.message.
        alert('Erro ao executar ação: ' + error.message);
      }
    }

    return { registro, payloadCorrigido, justificativa, semGeometria, errosRevalidacao, quadroErros, encerrado, executarAcao };
  }
};
</script>