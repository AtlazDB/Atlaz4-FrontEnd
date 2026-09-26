<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import { formatarArea } from '@/utils/formato'

/**
 * Mapa dos imóveis rurais sobre o Paraná, com o contorno do município filtrado.
 *
 * Os objetos do Leaflet ficam em variáveis comuns, fora de ref(): se o Vue
 * transformasse o mapa em objeto reativo, o Leaflet passaria a lidar com
 * proxies e quebraria ao arrastar e dar zoom.
 *
 * Cada imóvel é desenhado duas vezes — o polígono e um ponto no centro. Na
 * escala do estado um imóvel tem poucos metros e o polígono some; o ponto
 * garante que ele continue visível e clicável.
 */
const props = defineProps({
  imoveis: { type: Array, required: true },
  municipio: { type: Object, default: null },
  selecionadoCod: { type: String, default: null },
})

const emit = defineEmits(['selecionar'])

const CENTRO_PARANA = [-24.89, -51.55]
const ZOOM_PARANA = 7

const estilo = {
  poligono: { color: '#22d3ee', weight: 1.5, fillColor: '#22d3ee', fillOpacity: 0.15 },
  poligonoSelecionado: { color: '#f8fafc', weight: 2.5, fillColor: '#22d3ee', fillOpacity: 0.4 },
  ponto: { radius: 5, color: '#0b0f19', weight: 1.5, fillColor: '#22d3ee', fillOpacity: 1 },
  pontoSelecionado: { radius: 8, color: '#f8fafc', weight: 2, fillColor: '#22d3ee', fillOpacity: 1 },
  municipio: { color: '#cbd5e1', weight: 2, dashArray: '6 4', fill: false },
}

const container = ref(null)

let mapa = null
let camadaImoveis = null
let camadaMunicipio = null
const camadasPorCodigo = new Map()

onMounted(() => {
  mapa = L.map(container.value).setView(CENTRO_PARANA, ZOOM_PARANA)

  // Fundo escuro da Esri: não exige chave de API (o da CARTO, usado no
  // protótipo, passou a exigir). A camada de referência põe os nomes das
  // cidades por cima do fundo.
  const esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas'
  const atribuicao = 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap'
  L.tileLayer(`${esri}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
    attribution: atribuicao,
    maxZoom: 16,
  }).addTo(mapa)
  L.tileLayer(`${esri}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, {
    maxZoom: 16,
  }).addTo(mapa)

  desenharMunicipio()
  desenharImoveis()
  enquadrar()
})

onBeforeUnmount(() => {
  mapa?.remove()
  mapa = null
})

watch(
  () => props.imoveis,
  () => {
    desenharImoveis()
    enquadrar()
  },
)

watch(
  () => props.municipio,
  () => {
    desenharMunicipio()
    enquadrar()
  },
)

watch(
  () => props.selecionadoCod,
  (codigo) => {
    destacarSelecionado()
    const camadas = camadasPorCodigo.get(codigo)
    if (camadas) mapa.flyToBounds(camadas.poligono.getBounds(), { maxZoom: 14, duration: 0.6 })
  },
)

function desenharImoveis() {
  if (!mapa) return
  camadaImoveis?.remove()
  camadasPorCodigo.clear()
  camadaImoveis = L.featureGroup()

  for (const imovel of props.imoveis) {
    if (!imovel.geometria) continue

    const poligono = L.geoJSON(imovel.geometria)
    const ponto = L.circleMarker(poligono.getBounds().getCenter())

    // Texto montado como nó do DOM, e não como HTML: o código e o município
    // vêm dos arquivos das fontes e não devem ser interpretados como marcação.
    const dica = document.createElement('span')
    dica.textContent = `${imovel.codImovel} · ${imovel.municipio ?? '—'} · ${formatarArea(imovel.areaHa)}`

    for (const camada of [poligono, ponto]) {
      camada.bindTooltip(dica, { sticky: true })
      camada.on('click', () => emit('selecionar', imovel.codImovel))
      camadaImoveis.addLayer(camada)
    }

    camadasPorCodigo.set(imovel.codImovel, { poligono, ponto })
  }

  camadaImoveis.addTo(mapa)
  destacarSelecionado()
}

function desenharMunicipio() {
  if (!mapa) return
  camadaMunicipio?.remove()
  camadaMunicipio = null

  if (props.municipio?.geometria) {
    camadaMunicipio = L.geoJSON(props.municipio.geometria, { style: estilo.municipio, interactive: false })
    camadaMunicipio.addTo(mapa)
  }
}

function destacarSelecionado() {
  for (const [codigo, { poligono, ponto }] of camadasPorCodigo) {
    const selecionado = codigo === props.selecionadoCod
    poligono.setStyle(selecionado ? estilo.poligonoSelecionado : estilo.poligono)
    ponto.setStyle(selecionado ? estilo.pontoSelecionado : estilo.ponto)
    ponto.setRadius((selecionado ? estilo.pontoSelecionado : estilo.ponto).radius)
    if (selecionado) {
      poligono.bringToFront()
      ponto.bringToFront()
    }
  }
}

// Com município filtrado, mostra o município inteiro; sem filtro, os imóveis
// (ou o estado, se ainda não houver nenhum).
function enquadrar() {
  if (!mapa) return

  if (camadaMunicipio) {
    mapa.fitBounds(camadaMunicipio.getBounds(), { padding: [24, 24] })
  } else if (camadasPorCodigo.size) {
    mapa.fitBounds(camadaImoveis.getBounds(), { padding: [32, 32], maxZoom: 10 })
  } else {
    mapa.setView(CENTRO_PARANA, ZOOM_PARANA)
  }
}
</script>

<template>
  <div ref="container" class="isolate h-[480px] w-full overflow-hidden rounded-xl border border-slate-800" />
</template>
