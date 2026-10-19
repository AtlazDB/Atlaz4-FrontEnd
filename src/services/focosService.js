import http from './http'

/**
 * Focos de calor do INPE na área visível do mapa — só os que o IFC conta:
 * o satélite e a janela da regra vigente.
 *
 *   GET /focos?minLon=&minLat=&maxLon=&maxLat=&limite=2000
 *       200 → FeatureCollection de pontos + { truncado, limite, satelite, janelaMeses, inicio, fim }
 *       400 → { mensagem, campos }   (área inválida)
 *
 * `signal` vem de um AbortController, como no mapa de imóveis.
 */
export async function buscarFocosNoMapa(caixa, { limite = 2000, signal } = {}) {
  const { data } = await http.get('/focos', { params: { ...caixa, limite }, signal })
  return data
}
