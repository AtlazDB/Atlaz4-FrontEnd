<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import parana from '@/assets/parana.json'

// Objetos do Leaflet fora de ref(): o proxy do Vue atrapalha o Leaflet.
const props = defineProps({
  geometria: { type: Object, default: null },
  ponto: { type: Array, default: null },
})

const container = ref(null)
let mapa = null
let camada = null
let limitesParana = null

function desenhar() {
  if (!mapa) return
  camada?.remove()
  camada = L.featureGroup().addTo(mapa)

  if (props.geometria) {
    L.geoJSON(props.geometria, {
      style: (f) =>
        f.geometry.type.endsWith('Point')
          ? { color: '#fb923c', weight: 1.5, fillColor: '#f97316', fillOpacity: 0.9 }
          : { color: '#22d3ee', weight: 2, fillColor: '#22d3ee', fillOpacity: 0.15 },
      pointToLayer: (_, latlng) => L.circleMarker(latlng, { radius: 6 }),
    }).addTo(camada)
  }

  if (props.ponto) {
    L.circleMarker([props.ponto[1], props.ponto[0]], {
      radius: 8,
      color: '#f43f5e',
      weight: 2,
      fillColor: '#f43f5e',
      fillOpacity: 0.45,
    })
      .bindTooltip('Ponto do problema', { permanent: true, direction: 'right', offset: [8, 0] })
      .addTo(camada)
  }

  enquadrar()
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

onMounted(() => {
  mapa = L.map(container.value, { zoomControl: false, attributionControl: false })
  const esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas'
  L.tileLayer(`${esri}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 16 }).addTo(mapa)
  const contorno = L.geoJSON(parana, {
    interactive: false,
    style: { color: '#64748b', weight: 1, dashArray: '4 4', fill: false },
  }).addTo(mapa)
  limitesParana = contorno.getBounds()
  mapa.fitBounds(limitesParana)
  desenhar()
})

watch(() => [props.geometria, props.ponto], desenhar)

onBeforeUnmount(() => {
  mapa?.remove()
  mapa = null
})
</script>

<template>
  <div ref="container" class="isolate h-[250px] w-full overflow-hidden rounded-lg border border-slate-800" />
</template>
