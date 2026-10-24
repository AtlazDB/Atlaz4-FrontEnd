import http from './http'

export async function listarQuarentena({ texto, tipoErro, status, fonteId, pagina = 1, tamanho = 20 } = {}) {
  const { data } = await http.get('/quarentena', {
    params: {
      texto: texto || undefined,
      tipoErro: tipoErro || undefined,
      status: status || undefined,
      fonteId: fonteId || undefined,
      page: pagina - 1,
      size: tamanho,
      sort: 'id,desc',
    },
  })
  return data
}

export async function buscarMetricas() {
  const { data } = await http.get('/quarentena/metricas')
  return data
}

export async function buscarRegistro(id) {
  const { data } = await http.get(`/quarentena/${id}`)
  return data
}

/** null quando a geometria não pôde ser lida (204). */
export async function buscarGeometria(id) {
  const resposta = await http.get(`/quarentena/${id}/geometria`)
  return resposta.status === 204 ? null : resposta.data
}

export async function iniciarAnalise(id) {
  const { data } = await http.post(`/quarentena/${id}/iniciar-analise`)
  return data
}

export async function corrigir(id, payloadCorrigido, justificativa) {
  const { data } = await http.post(`/quarentena/${id}/corrigir`, { payloadCorrigido, justificativa })
  return data
}

export async function revalidar(id) {
  const { data } = await http.post(`/quarentena/${id}/revalidar`)
  return data
}

export async function descartar(id, justificativa) {
  const { data } = await http.post(`/quarentena/${id}/descartar`, { justificativa })
  return data
}
