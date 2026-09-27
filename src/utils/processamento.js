/**
 * Só o shapefile de imóveis do CAR, enviado como .zip, passa pelo
 * processamento no back-end. É a mesma regra do ProcessamentoCarServiceImpl
 * (Atlaz4-BackEnd) — se ela mudar lá, mude aqui também.
 */
export function ehProcessavel(fonte, arquivo) {
  return (
    fonte?.sigla?.toUpperCase() === 'CAR' &&
    !!arquivo?.nome?.toLowerCase().endsWith('.zip')
  )
}
