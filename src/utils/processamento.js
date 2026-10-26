/**
 * Quais arquivos o back-end sabe processar sozinho (sem o Airflow), pela
 * sigla da fonte:
 *   CAR         shapefile de imóveis (.zip)
 *   CAR-RL      shapefile de Reserva Legal (.zip)
 *   INPE-FOCOS  CSV de focos de calor (.csv, ou o .csv compactado em .zip)
 * É a mesma regra do ProcessamentoArquivoServiceImpl (Atlaz4-BackEnd) — se
 * ela mudar lá, mude aqui também. Esses a tela manda processar logo depois do
 * upload (processaAoReceber).
 */
const EXTENSOES_POR_FONTE = {
  CAR: ['.zip'],
  'CAR-RL': ['.zip'],
  'INPE-FOCOS': ['.csv', '.zip'],
}

/**
 * Com o Airflow, qualquer fonte é processada pelo caminho genérico, guiado
 * pelo mapeamento de colunas: zip (shapefile ou páginas GeoJSON da coleta por
 * link) e GeoJSON. Esses ganham o botão "Processar" (ehProcessavel), para
 * processar de novo depois de mapear as colunas ou de um REJEITADO. Sem o
 * Airflow, o back-end responde que não há processamento para a fonte.
 */
const EXTENSOES_GENERICAS = ['.zip', '.geojson', '.json']

function nomeDe(arquivo) {
  return arquivo?.nome?.toLowerCase() ?? ''
}

export function processaAoReceber(fonte, arquivo) {
  const extensoes = EXTENSOES_POR_FONTE[fonte?.sigla?.toUpperCase()]
  return !!extensoes && extensoes.some((ext) => nomeDe(arquivo).endsWith(ext))
}

export function ehProcessavel(fonte, arquivo) {
  return (
    processaAoReceber(fonte, arquivo) ||
    EXTENSOES_GENERICAS.some((ext) => nomeDe(arquivo).endsWith(ext))
  )
}
