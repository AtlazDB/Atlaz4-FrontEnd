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