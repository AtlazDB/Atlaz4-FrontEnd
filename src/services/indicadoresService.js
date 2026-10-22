import http from './http'

/**
 * Indicadores ambientais dos imóveis (IRL e IFC), calculados no Oracle pelo
 * pkg_indicadores.
 *
 *   GET  /imoveis/:codImovel/indicadores
 *        200 → { codImovel, indicadores: [ {
 *                  indicador, valor, unidade, status,     (CONFORME | ALERTA | CRITICO)
 *                  numerador,      IRL: ha de RL · IFC: quantidade de focos
 *                  areaImovelHa,   denominador da conta
 *                  saldoHa,        só IRL: + excedente, − déficit
 *                  calculadoEm,
 *                  regra:        { codigo, versao, nome, formula, descricao, parametros },
 *                  versaoImovel: { conjunto, versao, execucaoId, processadoEm, fonte, fonteNome, arquivoId, arquivo, hash },
 *                  versaoInsumo: { ... mesma forma: a RL ou os focos usados } } ] }
 *        404 → { mensagem }   (imóvel inexistente)
 *   indicadores vazio = ainda não calculado para este imóvel
 *
 *   GET  /imoveis/:codImovel/indicadores/:indicador/historico
 *        200 → [ mesma forma do item acima ], do cálculo mais recente para o mais antigo
 *
 *   POST /pipeline/indicadores
 *        200 → { irl, ifc, calculadoEm }   quantos indicadores cada cálculo gravou
 */

export async function buscarIndicadores(codImovel) {
  const { data } = await http.get(`/imoveis/${encodeURIComponent(codImovel)}/indicadores`)
  return data
}

export async function buscarHistorico(codImovel, indicador) {
  const { data } = await http.get(
    `/imoveis/${encodeURIComponent(codImovel)}/indicadores/${indicador}/historico`,
  )
  return data
}

/** Recalcula IRL e IFC de todos os imóveis. Pode levar alguns segundos. */
export async function calcularIndicadores() {
  const { data } = await http.post('/pipeline/indicadores', null, { timeout: 10 * 60_000 })
  return data
}
