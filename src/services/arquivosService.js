import http from './http'

/**
 * Arquivos já recebidos na zona bruta.
 *
 *   POST /arquivos/:id/processar
 *        200 → { arquivoId, status: 'PROCESSADO', execucaoId, versao,
 *                registrosLidos, registrosValidos, registrosInvalidos }
 *        200 → { arquivoId, status: 'REJEITADO', execucaoId, mensagemErro }
 *        400 → { mensagem }   (só .zip da fonte CAR pode ser processado)
 *        404 → { mensagem }
 *        409 → { mensagem }   (o arquivo já está sendo processado)
 *
 * Repare que REJEITADO volta com 200: o pedido deu certo, quem falhou foi
 * o arquivo. Por isso quem chama precisa olhar o `status` da resposta, e
 * não só o catch.
 */

/**
 * Valida o shapefile e grava os imóveis numa nova versão.
 *
 * A chamada é SÍNCRONA: o back-end só responde quando termina — segundos
 * para um município, muitos minutos para o Paraná inteiro. Por isso o
 * timeout aqui é bem maior que o padrão de 60 s do http.js.
 *
 * @param {number} arquivoId
 * @returns {Promise<object>} o resultado do processamento
 */
export async function processarArquivo(arquivoId) {
  const { data } = await http.post(`/arquivos/${arquivoId}/processar`, null, {
    timeout: 30 * 60_000,
  })
  return data
}
