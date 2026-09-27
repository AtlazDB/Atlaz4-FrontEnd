<script setup>
import { ref, watch, onMounted } from 'vue'
import BaseCard from '@/components/BaseCard.vue'
import FiltroTerritorio from '@/components/consulta/FiltroTerritorio.vue'
import MapaImoveis from '@/components/consulta/MapaImoveis.vue'
import TabelaImoveis from '@/components/consulta/TabelaImoveis.vue'
import { listarImoveis } from '@/services/imoveisService'
import { listarMunicipios, buscarMunicipio } from '@/services/municipiosService'

/**
 * Consulta territorial do Analista: imóveis rurais no mapa e numa tabela,
 * filtrados por município. É a única camada desta tela que fala com a API.
 */
const UF = 'PR'

// --- Filtro -------------------------------------------------------
const municipios = ref([])
const carregandoMunicipios = ref(false)
const erroMunicipios = ref('')
const codIbge = ref('')

// --- Resultado ----------------------------------------------------
const imoveis = ref([])
const municipio = ref(null) // com geometria, para o contorno no mapa
const carregando = ref(false)
const erro = ref('')
const selecionadoCod = ref(null)

// Se o filtro mudar antes da resposta anterior chegar, só a última consulta
// vale — senão uma resposta atrasada sobrescreveria a mais nova.
let consultaAtual = 0

async function carregarMunicipios() {
  carregandoMunicipios.value = true
  erroMunicipios.value = ''
  try {
    municipios.value = await listarMunicipios(UF)
  } catch (e) {
    erroMunicipios.value = e.message
  } finally {
    carregandoMunicipios.value = false
  }
}

async function carregarImoveis() {
  const consulta = ++consultaAtual
  carregando.value = true
  erro.value = ''
  selecionadoCod.value = null

  try {
    const [lista, detalhe] = await Promise.all([
      listarImoveis(codIbge.value ? { codIbge: codIbge.value } : { estado: UF }),
      codIbge.value ? buscarMunicipio(codIbge.value) : null,
    ])
    if (consulta !== consultaAtual) return
    imoveis.value = lista
    municipio.value = detalhe
  } catch (e) {
    if (consulta === consultaAtual) erro.value = e.message
  } finally {
    if (consulta === consultaAtual) carregando.value = false
  }
}

function selecionar(codigo) {
  selecionadoCod.value = selecionadoCod.value === codigo ? null : codigo
}

watch(codIbge, carregarImoveis)

onMounted(() => {
  carregarMunicipios()
  carregarImoveis()
})
</script>

<template>
  <div class="space-y-5">
    <BaseCard
      destaque
      titulo="Imóveis rurais · Paraná"
      icone="mapa"
      descricao="Escolha um município para ver os imóveis que ficam nele. Clique num imóvel no mapa
                 ou numa linha da tabela para localizá-lo."
    >
      <FiltroTerritorio
        v-model="codIbge"
        :municipios="municipios"
        :carregando="carregandoMunicipios"
        :erro="erroMunicipios"
      />
    </BaseCard>

    <div class="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <BaseCard class="lg:col-span-7" titulo="Mapa" icone="mapa">
        <MapaImoveis
          :imoveis="imoveis"
          :municipio="municipio"
          :selecionado-cod="selecionadoCod"
          @selecionar="selecionar"
        />
      </BaseCard>

      <BaseCard class="lg:col-span-5" titulo="Imóveis" icone="tabela">
        <TabelaImoveis
          :imoveis="imoveis"
          :carregando="carregando"
          :erro="erro"
          :selecionado-cod="selecionadoCod"
          @selecionar="selecionar"
          @tentar-novamente="carregarImoveis"
        />
      </BaseCard>
    </div>
  </div>
</template>
