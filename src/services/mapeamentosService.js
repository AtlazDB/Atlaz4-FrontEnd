import http from './http'

/**
 * Chamadas da tela de mapeamento de colunas (Tarefa 5).
 * Mesmo padrão dos outros services: sem try/catch aqui, o interceptor do
 * http.js já converte o erro numa Error com mensagem pronta.
 *
 *   GET /fontes/:id/colunas
 *        200 → [ { id, nome, tipo, exemplos, situacao, regraId } ]
 *        situacao: mapeada | nova | ausente
 *        404 → { mensagem }   (fonte não encontrada)
 */

/**
 * Colunas detectadas nos arquivos de uma fonte, já com a situação de cada uma.
 * @param {number} fonteId
 * @returns {Promise<Array>}
 */
export async function listarColunas(fonteId) {
  const { data } = await http.get(`/fontes/${fonteId}/colunas`)
  return data
}

/**
 * Domínios de valores (ex.: STATUS_CAR) com seus valores ativos.
 *   GET /dominios → [ { id, codigo, nome, descricao, valores: [ { valor, descricao } ] } ]
 */
export async function listarDominios() {
  const { data } = await http.get('/dominios')
  return data
}

/**
 * Tabelas contra as quais uma coluna pode ser conferida (integridade cruzada).
 *   GET /referencias-cruzadas → [ { codigo, nome } ]
 */
export async function listarReferenciasCruzadas() {
  const { data } = await http.get('/referencias-cruzadas')
  return data
}

/**
 * Tabelas da Zona Tratada que o mapeamento pode preencher, com os campos de cada uma.
 *   GET /destinos → [ { tabela, rotulo, campos: [ { nome, tipo, obrigatorio, observacao } ] } ]
 * tipo: TEXTO, INTEIRO, DECIMAL, DATA ou GEOMETRIA. O back recusa destino fora desta lista.
 */
export async function listarDestinos() {
  const { data } = await http.get('/destinos')
  return data
}

/**
 * Cria o mapeamento de uma coluna, com as regras de qualidade.
 *   POST /fontes/:id/mapeamentos
 *        201 → a regra criada
 *        400 → { mensagem, campos }   (regra de negócio violada)
 *        404 → { mensagem }           (fonte ou coluna não encontrada)
 *        409 → { mensagem }           (coluna ou campo de destino já mapeado)
 *
 * @param {number} fonteId
 * @param {object} mapeamento corpo do MapeamentoRequest
 */
export async function criarMapeamento(fonteId, mapeamento) {
  const { data } = await http.post(`/fontes/${fonteId}/mapeamentos`, mapeamento)
  return data
}

/**
 * Edita destino e regras de um mapeamento; a coluna de origem não muda.
 * Vale a partir do próximo processamento.
 *   PUT /fontes/:fonteId/mapeamentos/:mapeamentoId   (mesmo corpo do criar)
 *        200 → a regra · 400 → { mensagem, campos } · 404 · 409 (campo de destino ocupado)
 */
export async function atualizarMapeamento(fonteId, mapeamentoId, mapeamento) {
  const { data } = await http.put(`/fontes/${fonteId}/mapeamentos/${mapeamentoId}`, mapeamento)
  return data
}

/**
 * Mapeamentos (regras) já criados para uma fonte.
 *   GET /fontes/:id/mapeamentos
 *        200 → [ { id, colunaId, colunaNome, destinoTabela, campoDestino, tipoDado,
 *                  formatoOrigem, obrigatorio, chave, bloquearRegressao, validarCpfCnpj,
 *                  politicaGeometria, recortarPr, dominioId, dominioCodigo, referenciaCruzada } ]
 */
export async function listarMapeamentos(fonteId) {
  const { data } = await http.get(`/fontes/${fonteId}/mapeamentos`)
  return data
}

/**
 * Remove um mapeamento; a coluna volta a ser "nova".
 *   DELETE /fontes/:fonteId/mapeamentos/:mapeamentoId → 204
 *        404 → { mensagem }   (mapeamento não encontrado)
 */
export async function excluirMapeamento(fonteId, mapeamentoId) {
  await http.delete(`/fontes/${fonteId}/mapeamentos/${mapeamentoId}`)
}