<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import { formatarArea, formatarSituacao } from '@/utils/formato'

/**
 * Mapa dos imóveis rurais, carregado por área visível.
 *
 * O Paraná tem mais de 500 mil imóveis: não dá para desenhar todos. Então o
 * mapa só avisa ONDE o usuário está olhando (evento `area`) e a view busca os
 * imóveis daquela caixa e devolve pela prop `camada`. Abaixo do zoom mínimo a
 * área é grande demais e o mapa manda `null` — nada é buscado.
 *
 * Os objetos do Leaflet ficam em variáveis comuns, fora de ref(): se o Vue
 * transformasse o mapa em objeto reativo, o Leaflet passaria a lidar com
 * proxies e quebraria ao arrastar e dar zoom.
 */
const props = defineProps({
  /** FeatureCollection de GET /imoveis/mapa, ou null */
  camada: { type: Object, default: null },
  carregando: { type: Boolean, default: false },
  erro: { type: String, default: '' },
  /** município com geometria, para o contorno */
  municipio: { type: Object, default: null },
  /** imóvel selecionado, com a geometria completa */
  destaque: { type: Object, default: null },
})

const emit = defineEmits(['area', 'selecionar'])

const CENTRO_PARANA = [-24.89, -51.55]
const ZOOM_PARANA = 7
const ZOOM_MINIMO = 11 // abaixo disso a área visível tem imóveis demais
const ZOOM_MAXIMO = 16 // o fundo da Esri não tem tiles além disso

const estilo = {
  imovel: { color: '#22d3ee', weight: 1, fillColor: '#22d3ee', fillOpacity: 0.15 },
  destaque: { color: '#f8fafc', weight: 2.5, fillColor: '#22d3ee', fillOpacity: 0.4 },
  municipio: { color: '#cbd5e1', weight: 2, dashArray: '6 4', fill: false },
}

const container = ref(null)
const perto = ref(false) // zoom >= ZOOM_MINIMO

let mapa = null
let camadaImoveis = null
let camadaDestaque = null
let camadaMunicipio = null

const mensagem = computed(() => {
  if (!perto.value) return { tipo: 'info', texto: 'Aproxime o zoom para ver os imóveis' }
  if (props.erro) return { tipo: 'erro', texto: props.erro }
  if (props.carregando) return { tipo: 'info', texto: 'Carregando imóveis…' }
  if (props.camada?.truncado) {
    return { tipo: 'alerta', texto: 'Mostrando parte dos imóveis — aproxime o zoom' }
  }
  if (props.camada && !props.camada.features?.length) {
    return { tipo: 'info', texto: 'Nenhum imóvel nesta área' }
  }
  return null
})

const coresMensagem = {
  info: 'border-slate-700 text-slate-200',
  alerta: 'border-amber-500/50 text-amber-200',
  erro: 'border-red-500/50 text-red-200',
}

onMounted(() => {
  // preferCanvas: mil polígonos num único <canvas> em vez de mil elementos SVG.
  mapa = L.map(container.value, { preferCanvas: true }).setView(CENTRO_PARANA, ZOOM_PARANA)

  // Fundo escuro da Esri: não exige chave de API (o da CARTO, usado no
  // protótipo, passou a exigir). A camada de referência põe os nomes das
  // cidades por cima do fundo.
  const esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas'
  const atribuicao = 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap'
  L.tileLayer(`${esri}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
    attribution: atribuicao,
    maxZoom: ZOOM_MAXIMO,
  }).addTo(mapa)
  L.tileLayer(`${esri}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, {
    maxZoom: ZOOM_MAXIMO,
  }).addTo(mapa)

  // Uma camada só para os imóveis, reaproveitada a cada movimento: troca-se
  // o conteúdo (clearLayers + addData), não a camada.
  camadaImoveis = L.geoJSON(null, { style: estilo.imovel, onEachFeature: prepararImovel }).addTo(mapa)
  camadaDestaque = L.geoJSON(null, { style: estilo.destaque, interactive: false }).addTo(mapa)

  mapa.on('moveend', avisarArea)

  desenharMunicipio()
  desenharImoveis()
  desenharDestaque()
  avisarArea()
})

onBeforeUnmount(() => {
  mapa?.remove()
  mapa = null
})

watch(() => props.camada, desenharImoveis)
watch(() => props.destaque, desenharDestaque)
watch(
  () => props.municipio,
  () => {
    if (!mapa) return
    desenharMunicipio()
    if (camadaMunicipio) mapa.fitBounds(camadaMunicipio.getBounds(), { padding: [24, 24] })
    else mapa.setView(CENTRO_PARANA, ZOOM_PARANA)
  },
)

/** Diz à view qual caixa buscar — ou `null`, se o zoom estiver longe demais. */
function avisarArea() {
  perto.value = mapa.getZoom() >= ZOOM_MINIMO
  if (!perto.value) {
    emit('area', null)
    return
  }

  // Com o mapa bem afastado, getBounds() passa de ±180/±90 e a API recusa.
  const caixa = mapa.getBounds()
  emit('area', {
    minLon: limitar(caixa.getWest(), -180, 180),
    minLat: limitar(caixa.getSouth(), -90, 90),
    maxLon: limitar(caixa.getEast(), -180, 180),
    maxLat: limitar(caixa.getNorth(), -90, 90),
  })
}

function limitar(valor, minimo, maximo) {
  return Math.min(maximo, Math.max(minimo, valor))
}

function prepararImovel(feature, poligono) {
  const imovel = feature.properties
  poligono.bindPopup(() => montarPopup(imovel))
  poligono.on('click', () => emit('selecionar', imovel.codImovel))
}

// Texto montado como nó do DOM, e não como HTML: o código e o município
// vêm dos arquivos das fontes e não devem ser interpretados como marcação.
function montarPopup(imovel) {
  const caixa = document.createElement('div')
  const linhas = [
    ['Código', imovel.codImovel],
    ['Município', imovel.municipio ?? '—'],
    ['Área', formatarArea(imovel.areaHa)],
    ['Situação', formatarSituacao(imovel.situacao)],
  ]
  for (const [rotulo, valor] of linhas) {
    const linha = document.createElement('div')
    const titulo = document.createElement('strong')
    titulo.textContent = `${rotulo}: `
    linha.append(titulo, valor)
    caixa.append(linha)
  }
  return caixa
}

function desenharImoveis() {
  if (!mapa) return
  camadaImoveis.clearLayers()
  if (props.camada) camadaImoveis.addData(props.camada)
  // No canvas, quem é desenhado por último fica por cima: o destaque não pode
  // sumir embaixo dos imóveis que acabaram de chegar.
  camadaDestaque.bringToFront()
}

function desenharDestaque() {
  if (!mapa) return
  camadaDestaque.clearLayers()
  if (props.destaque?.geometria) camadaDestaque.addData(props.destaque.geometria)
}

function desenharMunicipio() {
  if (!mapa) return
  camadaMunicipio?.remove()
  camadaMunicipio = null

  if (props.municipio?.geometria) {
    camadaMunicipio = L.geoJSON(props.municipio.geometria, {
      style: estilo.municipio,
      interactive: false,
    }).addTo(mapa)
  }
}

/**
 * Leva o mapa até a caixa envolvente de um imóvel da tabela.
 * Atenção à ordem: a API e o GeoJSON usam [lon, lat]; o Leaflet usa [lat, lon].
 */
function enquadrar({ minLon, minLat, maxLon, maxLat }) {
  mapa?.fitBounds(
    [
      [minLat, minLon],
      [maxLat, maxLon],
    ],
    { padding: [32, 32], maxZoom: ZOOM_MAXIMO },
  )
}

defineExpose({ enquadrar })
</script>

<template>
  <div class="relative">
    <div
      ref="container"
      class="isolate h-[480px] w-full overflow-hidden rounded-xl border border-slate-800"
    />

    <div
      v-if="mensagem"
      class="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center px-3"
    >
      <span
        :class="[
          'rounded-full border bg-slate-950/85 px-3 py-1 text-xs backdrop-blur',
          coresMensagem[mensagem.tipo],
        ]"
      >
        {{ mensagem.texto }}
      </span>
    </div>
  </div>
</template>
