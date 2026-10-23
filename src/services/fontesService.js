import http from './http'

/**
 * Camada de serviço de Fontes — Integrada com a Task T1 (Link, Agendamento e Execução).
 */

/**
 * Lista as fontes cadastradas, com suporte opcional a filtro de busca.
 * @param {string} [busca] texto para filtrar por nome, sigla ou órgão
 * @returns {Promise<Array>} lista de fontes
 */
export async function listarFontes(busca = '') {
  const params = busca ? { params: { busca } } : {}
  const { data } = await http.get('/fontes', params)
  return data
}

/**
 * Cadastra uma nova fonte (suporta tanto modalidade MANUAL quanto LINK).
 * @param {object} fonte objeto contendo os dados do formulário
 * @returns {Promise<object>} a fonte criada pelo servidor
 */
export async function criarFonte(fonte) {
  const { data } = await http.post('/fontes', fonte)
  return data
}

/**
 * Envia um arquivo para uma fonte no modo MANUAL, com acompanhamento de progresso.
 */
export async function enviarArquivo(fonteId, arquivo, aoProgredir = () => {}) {
  const dados = new FormData()
  dados.append('arquivo', arquivo)

  const { data } = await http.post(`/fontes/${fonteId}/arquivos`, dados, {
    timeout: 10 * 60_000,
    onUploadProgress: (evento) => {
      if (!evento.total) return
      aoProgredir(Math.round((evento.loaded * 100) / evento.total))
    },
  })
  return data
}

/**
 * Exclui uma fonte pelo ID.
 */
export async function excluirFonte(fonteId) {
  await http.delete(`/fontes/${fonteId}`)
}

/**
 * [NOVO - Task T1] Testa a conectividade com a URL externa configurada na fonte.
 * @param {object} dadosFonte dados da fonte para teste do link
 * @returns {Promise<object>} resultado do teste de conexão
 */
export async function testarLinkFonte(dadosFonte) {
  const { data } = await http.post('/fontes/testar-link', dadosFonte)
  return data
}

/**
 * [NOVO - Task T1] Dispara a execução imediata de coleta de uma fonte por link.
 * @param {number} fonteId id da fonte
 * @returns {Promise<object>} status da execução
 */
export async function executarFonteAgora(fonteId) {
  const { data } = await http.post(`/fontes/${fonteId}/executar`)
  return data
}

export async function executarIngestaoFonte(id) {
  const { data } = await http.post(`/fontes/${id}/executar`)
  return data
}