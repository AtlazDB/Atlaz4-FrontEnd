import http from './http'

/**
 * Imóveis rurais da zona tratada.
 *
 * O Paraná tem mais de 500 mil imóveis — nenhuma destas funções traz todos
 * de uma vez. A tabela pede uma página (sem geometria) e o mapa pede só a
 * área visível na tela.
 *
 *   GET /imoveis/pagina?pagina=1&tamanho=50&municipio=&codImovel=
 *       200 → { itens, total, pagina, tamanho }   (pagina começa em 1)
 *   GET /imoveis/mapa?minLon=&minLat=&maxLon=&maxLat=&limite=1000
 *       200 → FeatureCollection + { truncado, limite }
 *       400 → { mensagem, campos }                (área inválida)
 *   GET /imoveis/:codImovel
 *       200 → um imóvel com a geometria completa
 */

/**
 * Uma página da tabela. Cada item traz a caixa envolvente
 * (minLon, minLat, maxLon, maxLat) para o mapa dar zoom, mas não a geometria.
 * Os filtros são "contém", sem diferenciar maiúsculas.
 */
export async function listarPaginaImoveis({ pagina = 1, tamanho = 50, municipio, codImovel } = {}) {
  const params = { pagina, tamanho }
  if (municipio) params.municipio = municipio
  if (codImovel) params.codImovel = codImovel

  const { data } = await http.get('/imoveis/pagina', { params })
  return data
}

/**
 * Imóveis dentro de uma caixa, com geometria, em GeoJSON.
 *
 * `signal` vem de um AbortController: quando o usuário continua arrastando
 * o mapa, quem chamou cancela o pedido anterior. Um pedido cancelado chega
 * no catch com `e.original.code === 'ERR_CANCELED'`.
 *
 * @param {{minLon:number, minLat:number, maxLon:number, maxLat:number}} caixa
 * @returns {Promise<object>} FeatureCollection com `truncado: true` se havia
 *   mais imóveis na área do que o limite
 */
export async function buscarImoveisNoMapa(caixa, { limite = 1000, signal } = {}) {
  const { data } = await http.get('/imoveis/mapa', { params: { ...caixa, limite }, signal })
  return data
}

/** Um imóvel com a geometria completa, para destacar no mapa. */
export async function buscarImovel(codImovel) {
  const { data } = await http.get(`/imoveis/${encodeURIComponent(codImovel)}`)
  return data
}
