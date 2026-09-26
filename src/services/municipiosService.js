import http from './http'

/** Municípios de uma UF, sem geometria — leve, para preencher o filtro. */
export async function listarMunicipios(estado) {
  const { data } = await http.get('/municipios', { params: { estado } })
  return data
}

/** Um município com o contorno em GeoJSON, para desenhar no mapa. */
export async function buscarMunicipio(codIbge) {
  const { data } = await http.get(`/municipios/${codIbge}`)
  return data
}
