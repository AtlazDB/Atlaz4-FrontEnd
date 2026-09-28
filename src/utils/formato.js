/** Utilitários de formatação. Prontos — use à vontade. */

/** 18432119 -> "17,6 MB" */
export function formatarTamanho(bytes) {
  if (bytes == null) return '—'
  const unidades = ['B', 'KB', 'MB', 'GB']
  let valor = bytes
  let i = 0
  while (valor >= 1024 && i < unidades.length - 1) {
    valor /= 1024
    i++
  }
  return `${valor.toFixed(i === 0 ? 0 : 1).replace('.', ',')} ${unidades[i]}`
}

/** 1234567 -> "1.234.567" */
export function formatarNumero(valor) {
  if (valor == null) return '—'
  return Number(valor).toLocaleString('pt-BR')
}

/** 1651.4 -> "1.651,4 ha" */
export function formatarArea(hectares) {
  if (hectares == null) return '—'
  return `${Number(hectares).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ha`
}

/** Situação do imóvel no CAR: "AT" -> "Ativo". A ordem é a do filtro na tela. */
export const SITUACOES = { AT: 'Ativo', PE: 'Pendente', CA: 'Cancelado', SU: 'Suspenso' }

export function formatarSituacao(sigla) {
  if (!sigla) return '—'
  return SITUACOES[sigla] ?? sigla
}

/** "2026-02-10T13:20:00.000Z" -> "10/02/2026 10:20" */
export function formatarDataHora(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
