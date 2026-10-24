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
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h4 class="text-sm font-semibold text-gray-300">Visualização Espacial do Erro</h4>
            <!-- Correção da geometria: manual (vértices / desenho) ou automática (prévia do RECTIFY) -->
            <div v-if="!encerrado" class="flex flex-wrap gap-2">
              <button v-if="!semGeometria" @click="alternarEdicao" :disabled="ocupado" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs font-semibold transition disabled:opacity-40">
                {{ modoGeometria === 'editando' ? 'Concluir edição' : 'Editar vértices' }}
              </button>
              <button @click="desenharNova" :disabled="ocupado || modoGeometria !== 'visualizar'" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs font-semibold transition disabled:opacity-40">Desenhar nova</button>
              <button v-if="!semGeometria" @click="corrigirAutomaticamente" :disabled="ocupado || modoGeometria !== 'visualizar'" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs font-semibold transition disabled:opacity-40">Corrigir automaticamente</button>
              <template v-if="geometriaPendente">
                <button @click="desfazerGeometria" :disabled="ocupado" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-xs font-semibold transition disabled:opacity-40">Desfazer</button>
                <button @click="salvarGeometria" :disabled="ocupado" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition disabled:opacity-40">Salvar geometria</button>
              </template>
            </div>
          </div>
          <div id="mapa-quarentena" class="w-full h-72 rounded-lg border border-gray-800 z-10"></div>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            <span v-if="!semGeometria"><span class="inline-block w-3 h-0.5 align-middle bg-red-500 mr-1"></span>Original</span>
            <span v-if="temGeometriaTrabalho"><span class="inline-block w-3 h-0.5 align-middle bg-emerald-500 mr-1"></span>{{ geometriaPendente ? 'Correção não salva' : 'Corrigida (salva)' }}</span>
            <span v-if="semGeometria && !temGeometriaTrabalho">Este registro não tem geometria: use "Desenhar nova".</span>
          </div>
          <p v-if="mensagemGeometria" class="text-xs" :class="mensagemGeometria.erro ? 'text-red-400' : 'text-emerald-400'">{{ mensagemGeometria.texto }}</p>
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
// Edição de vértices e desenho no Leaflet (layer.pm / map.pm).
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import quarentenaService from '@/services/quarentenaService';

// Status em que a análise já acabou: o back recusa qualquer ação (409).
const STATUS_ENCERRADOS = ['DESCARTADO', 'REVALIDADO', 'SUBSTITUIDO'];

const ESTILO_ORIGINAL = { color: '#ef4444', weight: 2, fillColor: '#ef4444', fillOpacity: 0.2 };
// Com uma correção por cima, a original fica tracejada para não confundir.
const ESTILO_ORIGINAL_SOB_CORRECAO = { ...ESTILO_ORIGINAL, dashArray: '6 4', fillOpacity: 0.05 };
const ESTILO_CORRIGIDA = { color: '#10b981', weight: 2, fillColor: '#10b981', fillOpacity: 0.3 };

// GeoJSON de uma resposta que pode ser 204 (sem geometria).
const corpoOuNulo = (resposta) => (resposta.status === 204 ? null : resposta.data);

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

    // Correção da geometria
    const modoGeometria = ref('visualizar'); // visualizar | editando | desenhando
    const geometriaPendente = ref(false); // a camada verde mudou e ainda não foi salva
    const temGeometriaTrabalho = ref(false);
    const mensagemGeometria = ref(null); // { texto, erro }
    const ocupado = ref(false);
    let geometriaOriginal = null;
    let geometriaSalva = null; // a corrigida que está no banco
    let camadaOriginal = null;
    let camadaTrabalho = null; // a correção (salva, prévia, editada ou desenhada), em verde
    let map = null;

    watch(() => props.isOpen, async (newVal) => {
      if (newVal && props.registroId) {
        const { data } = await quarentenaService.obterPorId(props.registroId);
        registro.value = data;
        payloadCorrigido.value = data.payloadCorrigido || data.payload || '';
        justificativa.value = '';
        errosRevalidacao.value = [];
        mensagemGeometria.value = null;
        modoGeometria.value = 'visualizar';
        geometriaPendente.value = false;

        // As geometrias não vêm no registro: o back serve à parte, já em GeoJSON.
        try {
          const [original, corrigida] = await Promise.all([
            quarentenaService.obterGeometria(props.registroId),
            quarentenaService.obterGeometriaCorrigida(props.registroId)
          ]);
          geometriaOriginal = corpoOuNulo(original);
          geometriaSalva = corpoOuNulo(corrigida);
        } catch (e) {
          console.error('Erro ao buscar geometria do registro', e);
          geometriaOriginal = null;
          geometriaSalva = null;
        }
        semGeometria.value = !geometriaOriginal;

        await nextTick();
        inicializarMapa(data);
      }
    });

    function inicializarMapa(data) {
      if (map) {
        map.remove();
        map = null;
      }
      camadaOriginal = null;
      camadaTrabalho = null;

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

      // O desenho de um polígono novo cai na camada de trabalho.
      map.on('pm:create', ({ layer }) => {
        map.removeLayer(layer);
        trocarGeometriaTrabalho(layer.toGeoJSON().geometry);
        modoGeometria.value = 'visualizar';
        geometriaPendente.value = true;
        mensagemGeometria.value = { texto: 'Polígono desenhado. Confira e clique em "Salvar geometria".' };
      });

      try {
        if (geometriaOriginal) {
          // Pontos viram círculo para não depender do ícone padrão do Leaflet.
          camadaOriginal = L.geoJSON(geometriaOriginal, {
            style: ESTILO_ORIGINAL,
            pmIgnore: true,
            pointToLayer: (_, latlng) => L.circleMarker(latlng, { ...ESTILO_ORIGINAL, radius: 8, fillOpacity: 0.8 })
          }).addTo(map);
          camadaOriginal.bindPopup(`<b>Erro:</b> ${data.tipoErro || data.motivo || '-'}`);
        }
        trocarGeometriaTrabalho(geometriaSalva);
        enquadrar();
      } catch (e) {
        console.error('Erro ao renderizar geometria no mapa', e);
      }
    }

    // Põe (ou tira, com null) a geometria verde e ajusta o estilo da original.
    function trocarGeometriaTrabalho(geojson) {
      if (camadaTrabalho) {
        map.removeLayer(camadaTrabalho);
        camadaTrabalho = null;
      }
      if (geojson) {
        camadaTrabalho = L.geoJSON(geojson, {
          style: ESTILO_CORRIGIDA,
          pointToLayer: (_, latlng) => L.circleMarker(latlng, { ...ESTILO_CORRIGIDA, radius: 8, fillOpacity: 0.8 })
        }).addTo(map);
      }
      temGeometriaTrabalho.value = !!camadaTrabalho;
      camadaOriginal?.setStyle(camadaTrabalho ? ESTILO_ORIGINAL_SOB_CORRECAO : ESTILO_ORIGINAL);
    }

    function enquadrar() {
      const limites = L.latLngBounds([]);
      if (camadaOriginal) limites.extend(camadaOriginal.getBounds());
      if (camadaTrabalho) limites.extend(camadaTrabalho.getBounds());
      if (limites.isValid()) map.fitBounds(limites, { padding: [20, 20], maxZoom: 16 });
    }

    // Uma geometria só a partir da camada verde: o back espera o "geometry" de um GeoJSON.
    function geometriaDaCamadaTrabalho() {
      const geometrias = camadaTrabalho.toGeoJSON().features.map((f) => f.geometry);
      if (geometrias.length === 1) return geometrias[0];
      return {
        type: 'MultiPolygon',
        coordinates: geometrias.flatMap((g) => (g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates]))
      };
    }

    // Manual: arrasta, cria (no meio de uma aresta) ou apaga (clique direito) vértices.
    // Sem correção ainda, a edição começa de uma cópia da original.
    function alternarEdicao() {
      if (modoGeometria.value === 'editando') {
        camadaTrabalho.eachLayer((camada) => camada.pm.disable());
        modoGeometria.value = 'visualizar';
        mensagemGeometria.value = { texto: 'Edição concluída. Clique em "Salvar geometria" para gravar.' };
        return;
      }
      if (!camadaTrabalho) trocarGeometriaTrabalho(geometriaOriginal);
      // O Oracle é quem decide se ficou válida: aqui a edição é livre.
      camadaTrabalho.eachLayer((camada) => camada.pm.enable({ allowSelfIntersection: true }));
      modoGeometria.value = 'editando';
      geometriaPendente.value = true;
      mensagemGeometria.value = { texto: 'Arraste os vértices; clique no meio de uma aresta para criar um e com o botão direito para apagar.' };
    }

    function desenharNova() {
      modoGeometria.value = 'desenhando';
      geometriaPendente.value = true; // deixa o "Desfazer" à mão para cancelar o desenho
      mensagemGeometria.value = { texto: 'Clique no mapa para marcar os vértices e no primeiro para fechar o polígono.' };
      map.pm.enableDraw('Polygon', { pathOptions: ESTILO_CORRIGIDA, allowSelfIntersection: false });
    }

    // Automática: só mostra a prévia (verde); grava quando o operador salvar.
    async function corrigirAutomaticamente() {
      ocupado.value = true;
      try {
        const { data } = await quarentenaService.sugerirCorrecaoGeometria(registro.value.id);
        trocarGeometriaTrabalho(data);
        enquadrar();
        geometriaPendente.value = true;
        mensagemGeometria.value = { texto: 'Prévia da correção automática em verde. Ajuste os vértices se precisar e salve.' };
      } catch (e) {
        mensagemGeometria.value = { texto: e.message, erro: true };
      } finally {
        ocupado.value = false;
      }
    }

    function desfazerGeometria() {
      map.pm.disableDraw();
      trocarGeometriaTrabalho(geometriaSalva);
      modoGeometria.value = 'visualizar';
      geometriaPendente.value = false;
      mensagemGeometria.value = null;
    }

    async function salvarGeometria() {
      map.pm.disableDraw();
      if (modoGeometria.value === 'editando') camadaTrabalho.eachLayer((camada) => camada.pm.disable());
      modoGeometria.value = 'visualizar';
      if (!camadaTrabalho) {
        mensagemGeometria.value = { texto: 'Nada para salvar: termine o desenho (clique no primeiro vértice).', erro: true };
        return;
      }
      ocupado.value = true;
      try {
        const geometria = geometriaDaCamadaTrabalho();
        const { data } = await quarentenaService.salvarGeometriaCorrigida(registro.value.id, geometria, justificativa.value || null);
        registro.value = data;
        geometriaSalva = geometria;
        geometriaPendente.value = false;
        mensagemGeometria.value = { texto: 'Geometria salva. O registro ficou CORRIGIDO: clique em "Revalidar" para conferir.' };
        emit('atualizado');
      } catch (e) {
        // Ex.: o Oracle ainda acha a geometria inválida. A edição continua na tela para ajustar.
        mensagemGeometria.value = { texto: e.message, erro: true };
      } finally {
        ocupado.value = false;
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

    return {
      registro, payloadCorrigido, justificativa, semGeometria, errosRevalidacao, quadroErros, encerrado, executarAcao,
      modoGeometria, geometriaPendente, temGeometriaTrabalho, mensagemGeometria, ocupado,
      alternarEdicao, desenharNova, corrigirAutomaticamente, desfazerGeometria, salvarGeometria
    };
  }
};
</script>