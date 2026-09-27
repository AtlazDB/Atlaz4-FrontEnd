import http from './http'

/**
 * Imóveis rurais da zona tratada. Cada imóvel já vem com a geometria em
 * GeoJSON, pronta para o mapa.
 *
 *   GET /imoveis?estado=PR        imóveis de uma UF
 *   GET /imoveis?codIbge=4113700  imóveis de um município
 */
export async function listarImoveis({ estado, codIbge } = {}) {
  const params = codIbge ? { codIbge } : estado ? { estado } : {}
  const { data } = await http.get('/imoveis', { params })
  return data
}
