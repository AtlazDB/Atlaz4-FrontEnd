// Leitura, conferência e resumo do "geometry" de um GeoJSON na tela da quarentena.
// A conferência aqui é só de estrutura (para o erro aparecer na hora, em português):
// quem decide se a geometria é válida é o Oracle, quando o operador salva.

const TIPOS = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']

/** GeoJSON indentado, mas com cada vértice numa linha só ([lon, lat]), para dar para ler. */
export function formatarGeoJson(geometria) {
  if (!geometria) return ''
  return JSON.stringify(geometria, null, 2).replace(
    /\[\s*((?:-?[\d.eE+-]+\s*,\s*)*-?[\d.eE+-]+)\s*\]/g,
    (_, numeros) => `[${numeros.split(/\s*,\s*/).join(', ')}]`,
  )
}

/** Partes, anéis e vértices, para o resumo em cima do texto. */
export function resumirGeometria(g) {
  if (!g?.coordinates) return null
  const c = g.coordinates
  switch (g.type) {
    case 'Point':
      return { tipo: g.type, partes: 1, aneis: 0, vertices: 1 }
    case 'MultiPoint':
    case 'LineString':
      return { tipo: g.type, partes: g.type === 'MultiPoint' ? c.length : 1, aneis: 0, vertices: c.length }
    case 'MultiLineString':
      return { tipo: g.type, partes: c.length, aneis: 0, vertices: c.flat().length }
    case 'Polygon':
      return { tipo: g.type, partes: 1, aneis: c.length, vertices: c.flat().length }
    case 'MultiPolygon':
      return { tipo: g.type, partes: c.length, aneis: c.flat().length, vertices: c.flat(2).length }
    default:
      return null
  }
}

function conferirPosicao(p, onde) {
  if (!Array.isArray(p) || p.length < 2 || !p.every((n) => typeof n === 'number' && Number.isFinite(n))) {
    throw new Error(`${onde}: cada vértice tem de ser [longitude, latitude], só com números.`)
  }
  const [lon, lat] = p
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new Error(
      `${onde}: [${lon}, ${lat}] está fora do mundo. A ordem é [longitude, latitude]: no Paraná, algo como [-51.4, -24.2].`,
    )
  }
}

function conferirLinha(linha, onde, minimo) {
  if (!Array.isArray(linha) || linha.length < minimo) {
    throw new Error(`${onde}: precisa de pelo menos ${minimo} vértices.`)
  }
  linha.forEach((p, i) => conferirPosicao(p, `${onde}, vértice ${i + 1}`))
}

function conferirAnel(anel, onde) {
  conferirLinha(anel, onde, 4)
  const [a, b] = [anel[0], anel[anel.length - 1]]
  if (a[0] !== b[0] || a[1] !== b[1]) {
    throw new Error(`${onde} não fecha: o primeiro e o último vértice têm de ser iguais.`)
  }
}

function conferirPoligono(aneis, prefixo) {
  if (!Array.isArray(aneis) || !aneis.length) throw new Error(`${prefixo || 'O polígono'} não tem anéis.`)
  aneis.forEach((anel, i) => {
    const nome = i === 0 ? 'contorno externo' : `buraco ${i}`
    conferirAnel(anel, `${prefixo ? `${prefixo}, ` : ''}${nome}`.replace(/^./, (l) => l.toUpperCase()))
  })
}

/**
 * Lê o texto digitado e devolve o "geometry". Aceita também uma Feature (ou uma
 * FeatureCollection com uma feature só), que é o que a maioria das ferramentas copia.
 * Lança Error com a mensagem para a tela.
 */
export function lerGeoJson(texto) {
  let dado
  try {
    dado = JSON.parse(texto)
  } catch (e) {
    throw new Error(`Não é um JSON válido: ${e.message}`)
  }
  if (dado?.type === 'FeatureCollection') {
    if (dado.features?.length !== 1) throw new Error('Cole uma geometria só (a coleção tem mais de uma feature).')
    dado = dado.features[0]
  }
  if (dado?.type === 'Feature') dado = dado.geometry
  if (!dado || !TIPOS.includes(dado.type)) {
    throw new Error(`O "type" tem de ser um destes: ${TIPOS.join(', ')}.`)
  }
  const c = dado.coordinates
  if (!Array.isArray(c)) throw new Error('Falta o "coordinates".')

  switch (dado.type) {
    case 'Point':
      conferirPosicao(c, 'O ponto')
      break
    case 'MultiPoint':
      conferirLinha(c, 'Os pontos', 1)
      break
    case 'LineString':
      conferirLinha(c, 'A linha', 2)
      break
    case 'MultiLineString':
      c.forEach((l, i) => conferirLinha(l, `Linha ${i + 1}`, 2))
      break
    case 'Polygon':
      conferirPoligono(c, '')
      break
    case 'MultiPolygon':
      if (!c.length) throw new Error('O multipolígono não tem partes.')
      c.forEach((p, i) => conferirPoligono(p, `parte ${i + 1}`))
      break
  }
  return { type: dado.type, coordinates: c }
}
