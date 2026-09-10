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
