<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
// Edição de vértices e desenho (layer.pm / mapa.pm).
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import parana from '@/assets/parana.json'
import { useTema } from '@/composables/useTema'

// Objetos do Leaflet fora de ref(): o proxy do Vue atrapalha o Leaflet.
// geometria: como chegou; trabalho: a correção (salva, prévia, editada ou desenhada).
const props = defineProps({
  geometria: { type: Object, default: null },
  ponto: { type: Array, default: null },
  trabalho: { type: Object, default: null },
  editavel: { type: Boolean, default: false },
  desenhando: { type: Boolean, default: false },
})

const emit = defineEmits(['desenhada'])

const ESTILO_CORRECAO = { color: '#34d399', weight: 2, fillColor: '#34d399', fillOpacity: 0.25 }

const { claro } = useTema()
const fundoEsri = () =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${claro.value ? 'Light' : 'Dark'}_Gray_Base/MapServer/tile/{z}/{y}/{x}`

const container = ref(null)
let mapa = null
let fundo = null
let camada = null
let camadaTrabalho = null
let limitesParana = null

function desenhar() {
  if (!mapa) return
  camada?.remove()
  camada = L.featureGroup().addTo(mapa)

  if (props.geometria) {
    // Com uma correção por cima, a original fica tracejada para não confundir.
    const sobCorrecao = !!props.trabalho
    L.geoJSON(props.geometria, {
      pmIgnore: true,
      style: (f) =>
        f.geometry.type.endsWith('Point')
          ? { color: '#fb923c', weight: 1.5, fillColor: '#f97316', fillOpacity: 0.9 }
          : {
              color: '#22d3ee',
              weight: 2,
              fillColor: '#22d3ee',
              fillOpacity: sobCorrecao ? 0.05 : 0.15,
              dashArray: sobCorrecao ? '6 4' : null,
            },
      pointToLayer: (_, latlng) => L.circleMarker(latlng, { radius: 6 }),
    }).addTo(camada)
  }

  if (props.ponto) {
    L.circleMarker([props.ponto[1], props.ponto[0]], {
      pmIgnore: true,
      radius: 8,
      color: '#f43f5e',
      weight: 2,
      fillColor: '#f43f5e',
      fillOpacity: 0.45,
    })
      .bindTooltip('Ponto do problema', { permanent: true, direction: 'right', offset: [8, 0] })
      .addTo(camada)
  }

  camadaTrabalho = null
  if (props.trabalho) {
    camadaTrabalho = L.geoJSON(props.trabalho, {
      style: ESTILO_CORRECAO,
      pointToLayer: (_, latlng) => L.circleMarker(latlng, { ...ESTILO_CORRECAO, radius: 6, fillOpacity: 0.8 }),
    }).addTo(camada)
  }

  alternarEdicao()
  enquadrar()
}

// O Oracle é quem decide se ficou válida: aqui a edição é livre.
function alternarEdicao() {
  camadaTrabalho?.eachLayer((l) => (props.editavel ? l.pm.enable({ allowSelfIntersection: true }) : l.pm.disable()))
}

function alternarDesenho() {
  if (!mapa) return
  if (props.desenhando) {
    mapa.pm.enableDraw('Polygon', { pathOptions: ESTILO_CORRECAO, allowSelfIntersection: false })
  } else {
    mapa.pm.disableDraw()
  }
}

// Ponto fora do PR: mostra o estado junto, para ficar claro onde ele caiu.
function enquadrar() {
  const limites = camada.getBounds()
  if (!limites.isValid()) return
  if (props.geometria?.type !== 'Point') {
    mapa.fitBounds(limites, { padding: [28, 28], maxZoom: 16 })
  } else if (limitesParana.contains(limites)) {
    mapa.setView(limites.getCenter(), 11)
  } else {
    mapa.fitBounds(L.latLngBounds(limitesParana).extend(limites), { padding: [20, 20] })
  }
}

/** A correção como está no mapa agora (com os vértices arrastados), como um "geometry" de GeoJSON. */
function lerTrabalho() {
  if (!camadaTrabalho) return null
  const geometrias = camadaTrabalho.toGeoJSON().features.map((f) => f.geometry)
  if (geometrias.length === 1) return geometrias[0]
  return {
    type: 'MultiPolygon',
    coordinates: geometrias.flatMap((g) => (g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates])),
  }
}

defineExpose({ lerTrabalho })

onMounted(() => {
  mapa = L.map(container.value, { zoomControl: false, attributionControl: false })
  mapa.pm.setLang('pt_br') // dicas do desenho ("Clique no primeiro marcador…") em português
  fundo = L.tileLayer(fundoEsri(), { maxZoom: 16 }).addTo(mapa)
  const contorno = L.geoJSON(parana, {
    interactive: false,
    pmIgnore: true,
    style: { color: '#64748b', weight: 1, dashArray: '4 4', fill: false },
  }).addTo(mapa)
  limitesParana = contorno.getBounds()
  mapa.fitBounds(limitesParana)
  // O polígono desenhado sobe para quem controla a correção, que o devolve em "trabalho".
  mapa.on('pm:create', ({ layer }) => {
    const geometria = layer.toGeoJSON().geometry
    layer.remove()
    emit('desenhada', geometria)
  })
  desenhar()
  alternarDesenho()
})

watch(() => [props.geometria, props.ponto, props.trabalho], desenhar)
watch(() => props.editavel, alternarEdicao)
watch(() => props.desenhando, alternarDesenho)
watch(claro, () => fundo?.setUrl(fundoEsri()))

onBeforeUnmount(() => {
  mapa?.remove()
  mapa = null
})
</script>

<template>
  <div ref="container" class="isolate h-[250px] w-full overflow-hidden rounded-lg border border-slate-800" />
</template>
