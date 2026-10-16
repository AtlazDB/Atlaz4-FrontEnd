/**
 * Quais arquivos o back-end sabe processar, pela sigla da fonte:
 *   CAR         shapefile de imóveis (.zip)
 *   CAR-RL      shapefile de Reserva Legal (.zip)
 *   INPE-FOCOS  CSV de focos de calor (.csv, ou o .csv compactado em .zip)
 * É a mesma regra do ProcessamentoArquivoServiceImpl (Atlaz4-BackEnd) — se
 * ela mudar lá, mude aqui também.
 */
const EXTENSOES_POR_FONTE = {
  CAR: ['.zip'],
  'CAR-RL': ['.zip'],
  'INPE-FOCOS': ['.csv', '.zip'],
}

export function ehProcessavel(fonte, arquivo) {
  const extensoes = EXTENSOES_POR_FONTE[fonte?.sigla?.toUpperCase()]
  const nome = arquivo?.nome?.toLowerCase() ?? ''
  return !!extensoes && extensoes.some((ext) => nome.endsWith(ext))
}
