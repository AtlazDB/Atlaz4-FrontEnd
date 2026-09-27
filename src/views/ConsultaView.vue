<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import BaseCard from '@/components/BaseCard.vue'
import FiltroTerritorio from '@/components/consulta/FiltroTerritorio.vue'
import MapaImoveis from '@/components/consulta/MapaImoveis.vue'
import TabelaImoveis from '@/components/consulta/TabelaImoveis.vue'
import {
  listarPaginaImoveis,
  buscarImoveisNoMapa,
  buscarImovel,
} from '@/services/imoveisService'
import { listarMunicipios, buscarMunicipio } from '@/services/municipiosService'
import { semAcento } from '@/utils/formato'

/**
 * Consulta territorial do Analista: imóveis rurais no mapa e numa tabela.
 * É a única camada desta tela que fala com a API.
 *
 * Mapa e tabela são independentes: a tabela pagina TODOS os imóveis que
 * passam no filtro; o mapa mostra os que estão na área visível, seja qual
 * for o filtro. O contorno do município só ajuda a achar o lugar.
 */
const UF = 'PR'
const TAMANHO = 50

// --- Filtro -------------------------------------------------------
const municipios = ref([])
const carregandoMunicipios = ref(false)
const erroMunicipios = ref('')
const erroContorno = ref('')
const codIbge = ref('')
const codImovel = ref('')
const municipio = ref(null) // com geometria, para o contorno no mapa

// --- Tabela -------------------------------------------------------
const itens = ref([])
const total = ref(0)
const pagina = ref(1)
const carregando = ref(false)
const erro = ref('')

// --- Mapa ---------------------------------------------------------
const mapaRef = ref(null)
const camada = ref(null) // FeatureCollection da área visível
const carregandoMapa = ref(false)
const erroMapa = ref('')

// --- Seleção ------------------------------------------------------
const selecionadoCod = ref(null)
const destaque = ref(null) // o imóvel selecionado, com a geometria completa

// Se o filtro mudar antes da resposta anterior chegar, só a última consulta
// vale — senão uma resposta atrasada sobrescreveria a mais nova.
let consultaAtual = 0
let contornoAtual = 0
let selecaoAtual = 0
let pedidoMapa = null // AbortController do pedido do mapa em andamento
let ultimaCaixa = null // última área visível avisada pelo mapa
let esperaBusca = null // setTimeout da busca por código

const nomeMunicipio = computed(
  () => municipios.value.find((m) => m.codIbge === codIbge.value)?.nome ?? '',
)

// O nome como o CAR grava: sem acento ("Maringa"). Vale para a tabela e o mapa.
const nomeFiltro = computed(() => nomeMunicipio.value && semAcento(nomeMunicipio.value))

async function carregarMunicipios() {
  carregandoMunicipios.value = true
  erroMunicipios.value = ''
  try {
    municipios.value = await listarMunicipios(UF)
  } catch (e) {
    erroMunicipios.value = `Não deu para carregar a lista de municípios: ${e.message}`
  } finally {
    carregandoMunicipios.value = false
  }
}

/**
 * Busca a página atual da tabela.
 *
 * O município vai pelo NOME, sem acento: os imóveis carregados do CAR não
 * têm o vínculo com o código IBGE, e o CAR grava "Maringa" onde o IBGE diz
 * "Maringá". O filtro do back-end é "contém" — escolher Ivaí também traz
 * Ivaiporã. Está anotado no CLAUDE.md para ajustar no back.
 */
async function carregarPagina() {
  const consulta = ++consultaAtual
  carregando.value = true
  erro.value = ''
  try {
    const resposta = await listarPaginaImoveis({
      pagina: pagina.value,
      tamanho: TAMANHO,
      municipio: nomeFiltro.value,
      codImovel: codImovel.value.trim(),
    })
    if (consulta !== consultaAtual) return
    itens.value = resposta.itens
    total.value = resposta.total
  } catch (e) {
    if (consulta === consultaAtual) erro.value = e.message
  } finally {
    if (consulta === consultaAtual) carregando.value = false
  }
}

function mudarPagina(nova) {
  pagina.value = nova
  carregarPagina()
}

function recomecar() {
  pagina.value = 1
  carregarPagina()
}

/**
 * Contorno do município no mapa (o mapa dá fitBounds sozinho quando ele
 * chega). Se falhar, a tabela continua filtrando normalmente.
 */
async function carregarContorno(cod) {
  const pedido = ++contornoAtual
  erroContorno.value = ''
  if (!cod) {
    municipio.value = null
    return
  }
  try {
    const detalhe = await buscarMunicipio(cod)
    if (pedido === contornoAtual) municipio.value = detalhe
  } catch (e) {
    if (pedido !== contornoAtual) return
    municipio.value = null
    erroContorno.value = `Não deu para carregar o contorno do município: ${e.message}`
  }
}

/**
 * O mapa avisa a área visível a cada movimento (ou `null`, se o zoom
 * estiver longe demais). Se o usuário continuar arrastando, o pedido
 * anterior é cancelado — só a última área interessa.
 */
async function aoMoverMapa(caixa) {
  ultimaCaixa = caixa
  pedidoMapa?.abort()
  pedidoMapa = null
  erroMapa.value = ''

  if (!caixa) {
    camada.value = null
    carregandoMapa.value = false
    return
  }

  const controle = new AbortController()
  pedidoMapa = controle
  carregandoMapa.value = true
  try {
    const colecao = await buscarImoveisNoMapa(caixa, {
      municipio: nomeFiltro.value,
      signal: controle.signal,
    })
    camada.value = doMunicipio(colecao)
  } catch (e) {
    // Cancelado de propósito: não é erro. O interceptor do http.js embrulha
    // o erro do Axios, mas deixa o original em `e.original`.
    if (e.original?.code === 'ERR_CANCELED') return
    erroMapa.value = e.message
  } finally {
    if (pedidoMapa === controle) {
      pedidoMapa = null
      carregandoMapa.value = false
    }
  }
}

/**
 * PALIATIVO até o back-end filtrar o /imoveis/mapa por município: tira da
 * coleção os imóveis de outros municípios.
 *
 * Compara por IGUALDADE (sem acento e sem maiúsculas), então Ivaí não traz
 * Ivaiporã. O limite: o back corta em 1000 imóveis ANTES deste filtro, e
 * numa área densa os 1000 podem ser quase todos do vizinho — aí faltam
 * imóveis do município (o aviso de `truncado` continua aparecendo).
 * Quando o back filtrar, esta função vira um no-op e pode ser apagada.
 */
function doMunicipio(colecao) {
  if (!nomeFiltro.value) return colecao
  const alvo = nomeFiltro.value.toLowerCase()
  return {
    ...colecao,
    features: colecao.features.filter(
      (f) => semAcento(f.properties.municipio ?? '').toLowerCase() === alvo,
    ),
  }
}

/**
 * Marca (ou desmarca, se clicar de novo) um imóvel e busca a geometria
 * completa dele para o destaque. Devolve true se ficou selecionado.
 */
function alternarSelecao(codigo) {
  const pedido = ++selecaoAtual
  destaque.value = null

  if (selecionadoCod.value === codigo) {
    selecionadoCod.value = null
    return false
  }

  selecionadoCod.value = codigo
  buscarImovel(codigo)
    .then((imovel) => {
      if (pedido === selecaoAtual) destaque.value = imovel
    })
    .catch((e) => {
      if (pedido === selecaoAtual) erroMapa.value = e.message
    })
  return true
}

// Da tabela: o item traz a caixa envolvente, então o mapa vai até o imóvel.
function selecionarDaTabela(item) {
  if (alternarSelecao(item.codImovel)) mapaRef.value?.enquadrar(item)
}

// Do mapa: o usuário já está olhando para o imóvel.
function selecionarDoMapa(codigo) {
  alternarSelecao(codigo)
}

// Trocar o município busca na hora; digitar o código espera 400 ms parado,
// para não disparar um pedido a cada tecla.
watch([codIbge, codImovel], ([ibge], [ibgeAntes]) => {
  clearTimeout(esperaBusca)
  if (ibge !== ibgeAntes) recomecar()
  else esperaBusca = setTimeout(recomecar, 400)
})

// Trocar o município também refaz o mapa. O fitBounds no contorno quase
// sempre dispara um moveend (e um pedido novo) logo em seguida; o
// AbortController descarta o que ficar duplicado.
watch(codIbge, (cod) => {
  carregarContorno(cod)
  aoMoverMapa(ultimaCaixa)
})

onMounted(() => {
  carregarMunicipios()
  carregarPagina()
})

onBeforeUnmount(() => {
  pedidoMapa?.abort()
  clearTimeout(esperaBusca)
})
</script>

<template>
  <div class="space-y-5">
    <BaseCard
      destaque
      titulo="Imóveis rurais · Paraná"
      icone="mapa"
      descricao="Filtre por município ou pelo código do imóvel. Aproxime o zoom no mapa para ver os
                 perímetros, e clique numa linha da tabela para localizar o imóvel."
    >
      <FiltroTerritorio
        v-model:cod-ibge="codIbge"
        v-model:cod-imovel="codImovel"
        :municipios="municipios"
        :carregando="carregandoMunicipios"
        :erro="erroMunicipios || erroContorno"
      />
    </BaseCard>

    <div class="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <BaseCard class="lg:col-span-7" titulo="Mapa" icone="mapa">
        <MapaImoveis
          ref="mapaRef"
          :camada="camada"
          :carregando="carregandoMapa"
          :erro="erroMapa"
          :municipio="municipio"
          :destaque="destaque"
          :filtrado="!!nomeFiltro"
          @area="aoMoverMapa"
          @selecionar="selecionarDoMapa"
        />
      </BaseCard>

      <BaseCard class="lg:col-span-5" titulo="Imóveis" icone="tabela">
        <TabelaImoveis
          :itens="itens"
          :total="total"
          :pagina="pagina"
          :tamanho="TAMANHO"
          :carregando="carregando"
          :erro="erro"
          :selecionado-cod="selecionadoCod"
          @selecionar="selecionarDaTabela"
          @mudar-pagina="mudarPagina"
          @tentar-novamente="carregarPagina"
        />
      </BaseCard>
    </div>
  </div>
</template>
