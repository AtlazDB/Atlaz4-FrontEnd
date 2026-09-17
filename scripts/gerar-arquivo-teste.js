/**
 * Gera um CSV grande para você testar a barra de progresso.
 *
 *   npm run arquivo-teste
 *
 * Por que precisa ser grande? Veja a explicação no README, seção
 * "Testando a barra de progresso". Resumo: em localhost o sistema
 * operacional engole vários MB de uma vez, e o navegador já considera
 * esses bytes como "enviados". Com um arquivo pequeno a barra pula de
 * 0% a 100% mesmo com o servidor lendo devagar.
 */

import { createWriteStream, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PASTA = join(__dirname, '..', 'exemplos')
mkdirSync(PASTA, { recursive: true })

const MB_ALVO = Number(process.argv[2] || 15)
const CAMINHO = join(PASTA, `car_imoveis_${MB_ALVO}mb.csv`)

const municipios = ['Ponta Grossa', 'Cascavel', 'Maringá', 'Londrina', 'Guarapuava', 'Toledo']
const biomas = ['Mata Atlântica', 'Cerrado']

const saida = createWriteStream(CAMINHO)
saida.write('cod_imovel,municipio,uf,bioma,area_ha,area_app_ha,area_rl_ha,data_cadastro\n')

const alvoBytes = MB_ALVO * 1024 * 1024
let escritos = 0
let i = 0

function preencher() {
  let podeContinuar = true
  while (escritos < alvoBytes && podeContinuar) {
    i++
    const linha =
      `PR-41${String(i).padStart(8, '0')}-${Math.random().toString(36).slice(2, 10).toUpperCase()},` +
      `${municipios[i % municipios.length]},PR,${biomas[i % biomas.length]},` +
      `${(Math.random() * 900 + 10).toFixed(2)},${(Math.random() * 80).toFixed(2)},` +
      `${(Math.random() * 200).toFixed(2)},${2020 + (i % 6)}-0${(i % 9) + 1}-1${i % 9}\n`

    escritos += Buffer.byteLength(linha)
    podeContinuar = saida.write(linha)
  }

  if (escritos < alvoBytes) {
    saida.once('drain', preencher)
  } else {
    saida.end()
  }
}

saida.on('finish', () => {
  console.log(`\n  Arquivo de teste criado:`)
  console.log(`  ${CAMINHO}`)
  console.log(`  ${(escritos / 1024 / 1024).toFixed(1)} MB · ${i.toLocaleString('pt-BR')} linhas\n`)
  console.log(`  Arraste esse arquivo para a área de upload da tela de fontes.\n`)
})

preencher()
