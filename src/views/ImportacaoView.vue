<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseButton from '@/components/BaseButton.vue'
import AppIcon from '@/components/AppIcon.vue'
import FonteList from '@/components/fontes/FonteList.vue'
import FonteForm from '@/components/fontes/FonteForm.vue'
import FonteUpload from '@/components/fontes/FonteUpload.vue'
import ArquivoList from '@/components/fontes/ArquivoList.vue'
import { listarFontes, criarFonte, enviarArquivo } from '@/services/fontesService'
import { processarArquivo, excluirArquivo } from '@/services/arquivosService'
import { ehProcessavel } from '@/utils/processamento'
import { formatarNumero } from '@/utils/formato'

/**
 * ==================================================================
 * CADASTRO & IMPORTAÇÃO — o "cérebro" da tela (TODO 7, 8 e 9)
 * ==================================================================
 * Esta é a única camada que conversa com o service. Os componentes
 * filhos só recebem props e emitem eventos.
 *
 * Ordem sugerida: faça os TODOs 1 a 6 primeiro (service, formulário e
 * upload), e só então volte aqui para ligar tudo.
 */

// --- Estado da listagem -------------------------------------------
const fontes = ref([])
const carregando = ref(false)
const erro = ref('')

// --- Estado do formulário -----------------------------------------
const mostrandoForm = ref(false)
const salvando = ref(false)
const formRef = ref(null)

// --- Estado do upload ---------------------------------------------
const selecionada = ref(null)
const enviando = ref(false)
const progresso = ref(0)
const uploadRef = ref(null)

// --- Estado do processamento --------------------------------------
const emProcessamento = ref([]) // ids mandados processar que ainda não responderam
const resultados = ref({}) // id do arquivo → { tipo, texto } do último processamento
const excluindo = ref([]) // ids com exclusão em andamento
let consulta = null // o setInterval da consulta periódica
let atualizando = false

// --- Aviso na tela (sucesso/erro) ---------------------------------
const aviso = ref(null) // { tipo: 'ok' | 'erro', texto: string }
let timerAviso = null

// O clearTimeout evita que o timer de um aviso antigo apague um aviso
// novo antes da hora — o resultado do processamento pode chegar poucos
// segundos depois do "Arquivo enviado".
function avisar(tipo, texto) {
  aviso.value = { tipo, texto }
  clearTimeout(timerAviso)
  timerAviso = setTimeout(() => (aviso.value = null), 5000)
}

/**
 * TODO 7 — Carregar as fontes da API.
 *
 *   a) marque carregando.value = true e limpe erro.value
 *   b) chame `await listarFontes()` e jogue o resultado em fontes.value
 *   c) se der erro, guarde a mensagem em erro.value
 *   d) no finally, carregando.value = false
 *
 * O esqueleto do try/catch/finally já está aí — só preencha.
 */
async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    fontes.value = await listarFontes()
  } catch (e) {
    erro.value = e.message
  } finally {
    carregando.value = false
  }
}

/**
 * TODO 8 — Cadastrar uma fonte nova.
 * Recebe os dados do evento 'salvar' emitido pelo FonteForm.
 *
 *   a) salvando.value = true
 *   b) `const nova = await criarFonte(dados)`
 *   c) coloque a nova fonte no topo da lista: fontes.value.unshift(nova)
 *      (ou chame carregar() de novo — as duas abordagens são válidas;
 *       unshift é mais rápido, recarregar é mais garantido)
 *   d) feche o formulário, limpe os campos (formRef.value.limpar())
 *      e chame avisar('ok', 'Fonte cadastrada.')
 *   e) no catch, avisar('erro', e.message)
 */
async function salvarFonte(dados) {
  salvando.value = true
  try {
    const nova = await criarFonte(dados)
    fontes.value.unshift(nova)
    mostrandoForm.value = false
    formRef.value.limpar()
    avisar('ok', 'Fonte cadastrada.')
  } catch (e) {
    avisar('erro', e.message)
  } finally {
    salvando.value = false
  }
}

/**
 * TODO 9 — Enviar o arquivo, atualizando a barra de progresso.
 * Recebe o File do evento 'enviar' emitido pelo FonteUpload.
 *
 *   a) enviando.value = true e progresso.value = 0
 *   b) chame o service passando o callback de progresso:
 *
 *        const { fonte } = await enviarArquivo(
 *          selecionada.value.id,
 *          arquivo,
 *          (pct) => { progresso.value = pct },
 *        )
 *
 *      Esse terceiro argumento é a ponte: o Axios avisa o service,
 *      o service avisa esta função, esta função atualiza a ref, e o
 *      Vue redesenha a barra. Reatividade de ponta a ponta.
 *
 *   c) com a fonte atualizada que voltou do servidor, troque a versão
 *      antiga na lista:
 *
 *        const i = fontes.value.findIndex((f) => f.id === fonte.id)
 *        if (i !== -1) fontes.value[i] = fonte
 *        selecionada.value = fonte
 *
 *   d) uploadRef.value.limpar() e avisar('ok', 'Arquivo enviado.')
 *   e) no finally, enviando.value = false e progresso.value = 0
 */
async function enviar(arquivo) {
  enviando.value = true
  progresso.value = 0
  try {
    const { fonte, arquivo: recebido } = await enviarArquivo(
      selecionada.value.id,
      arquivo,
      (pct) => {
        progresso.value = pct
      },
    )

    const i = fontes.value.findIndex((f) => f.id === fonte.id)
    if (i !== -1) fontes.value[i] = fonte
    selecionada.value = fonte

    uploadRef.value.limpar()
    avisar('ok', 'Arquivo enviado.')

    // Sem await de propósito: o aviso acima aparece na hora e o
    // processamento segue em segundo plano (ver processar()).
    if (ehProcessavel(fonte, recebido)) processar(recebido)
  } catch (e) {
    avisar('erro', e.message)
  } finally {
    enviando.value = false
    progresso.value = 0
  }
}

/**
 * Manda o back-end processar um arquivo do CAR (.zip).
 *
 * A chamada é síncrona e pode levar muitos minutos, então quem chama esta
 * função NÃO usa await — a tela continua respondendo. O andamento aparece
 * pela consulta periódica (logo abaixo); o resultado final chega aqui.
 *
 * Atenção: REJEITADO volta com HTTP 200, então não cai no catch. O catch
 * só pega erro de requisição (400, 404, 409, servidor fora do ar...).
 */
async function processar(arquivo) {
  const id = arquivo.id
  if (emProcessamento.value.includes(id)) return

  emProcessamento.value.push(id)
  delete resultados.value[id]
  try {
    const resposta = await processarArquivo(id)
    if (resposta.status === 'PROCESSADO') {
      concluir(
        arquivo,
        'ok',
        `Processado: ${formatarNumero(resposta.registrosLidos)} lidos · ` +
          `${formatarNumero(resposta.registrosValidos)} válidos · ` +
          `${formatarNumero(resposta.registrosInvalidos)} inválidos.`,
      )
    } else {
      concluir(arquivo, 'erro', `Rejeitado: ${resposta.mensagemErro}`)
    }
  } catch (e) {
    concluir(arquivo, 'erro', e.message)
  } finally {
    emProcessamento.value = emProcessamento.value.filter((x) => x !== id)
    atualizar()
  }
}

// O resultado fica na linha do arquivo e também sobe como aviso, para
// quem estiver olhando outra fonte quando o processamento terminar.
function concluir(arquivo, tipo, texto) {
  resultados.value[arquivo.id] = { tipo, texto }
  avisar(tipo, `${arquivo.nome} — ${texto}`)
}

/**
 * Recarrega as fontes sem ligar o `carregando` — senão a lista viraria
 * esqueleto a cada 3 segundos. Se falhar, mantém o que está na tela e a
 * próxima volta da consulta tenta de novo.
 */
async function atualizar() {
  if (atualizando) return // a volta anterior ainda não respondeu
  atualizando = true
  try {
    fontes.value = await listarFontes()
    // `selecionada` guarda o objeto antigo: troca pela versão nova da mesma fonte
    if (selecionada.value) {
      selecionada.value =
        fontes.value.find((f) => f.id === selecionada.value.id) ?? selecionada.value
    }
  } catch {
    // silencioso de propósito — é só a consulta de fundo
  } finally {
    atualizando = false
  }
}

/**
 * Consulta periódica: enquanto houver arquivo PROCESSANDO, recarrega a
 * lista a cada 3 s. Conta também os ids que esta tela acabou de mandar
 * processar — a primeira consulta pode chegar antes de o back-end gravar
 * PROCESSANDO, e a consulta pararia cedo demais.
 *
 * A consulta liga e desliga sozinha pelo watch: ninguém chama
 * iniciarConsulta() direto.
 */
const haProcessando = computed(
  () =>
    emProcessamento.value.length > 0 ||
    fontes.value.some((f) => f.arquivos?.some((a) => a.status === 'PROCESSANDO')),
)

function iniciarConsulta() {
  if (!consulta) consulta = setInterval(atualizar, 3000)
}

function pararConsulta() {
  clearInterval(consulta)
  consulta = null
}

watch(haProcessando, (sim) => (sim ? iniciarConsulta() : pararConsulta()))

/**
 * Exclui um arquivo REJEITADO — do catálogo e da zona bruta, sem volta.
 * Se o back-end recusar (409: não está rejeitado, ou já gerou versão de
 * dados), a mensagem chega pronta pelo interceptor do http.js.
 */
async function excluir(arquivo) {
  const confirmado = window.confirm(
    `Excluir "${arquivo.nome}"?\n\nO arquivo é apagado do catálogo e da zona bruta. Não dá para desfazer.`,
  )
  if (!confirmado || excluindo.value.includes(arquivo.id)) return

  excluindo.value.push(arquivo.id)
  try {
    await excluirArquivo(arquivo.id)
    delete resultados.value[arquivo.id]
    avisar('ok', `${arquivo.nome} excluído.`)
    await atualizar()
  } catch (e) {
    avisar('erro', e.message)
  } finally {
    excluindo.value = excluindo.value.filter((x) => x !== arquivo.id)
  }
}

function selecionar(fonte) {
  selecionada.value = fonte
  uploadRef.value?.limpar()
}

onMounted(carregar)
onBeforeUnmount(() => {
  pararConsulta()
  clearTimeout(timerAviso)
})
</script>

<template>
  <div class="space-y-5">
    <!-- Aviso de sucesso/erro -->
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="-translate-y-1 opacity-0"
      leave-active-class="transition duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="aviso"
        :class="[
          'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm',
          aviso.tipo === 'ok'
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
            : 'border-red-500/40 bg-red-500/10 text-red-300',
        ]"
      >
        <AppIcon :nome="aviso.tipo === 'ok' ? 'check' : 'alerta'" class="h-4 w-4 shrink-0" />
        {{ aviso.texto }}
      </div>
    </Transition>

    <div class="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <!-- Coluna da esquerda: as fontes de dados cadastradas -->
      <div class="lg:col-span-4">
        <BaseCard titulo="Fontes cadastradas" icone="camadas">
          <template #acoes>
            <!-- Cadastro de fonte desabilitado por enquanto: o botão fica visível,
                 mas não abre o formulário. Para reativar, remova o `disabled`. -->
            <BaseButton
              variante="secundario"
              tamanho="sm"
              disabled
              @click="mostrandoForm = !mostrandoForm"
            >
              <AppIcon v-if="!mostrandoForm" nome="mais" traco="2.4" class="h-3 w-3" />
              {{ mostrandoForm ? 'Fechar' : 'Nova fonte' }}
            </BaseButton>
          </template>

          <FonteList
            :fontes="fontes"
            :carregando="carregando"
            :erro="erro"
            :selecionada-id="selecionada?.id ?? null"
            @selecionar="selecionar"
            @tentar-novamente="carregar"
          />

          <div v-if="mostrandoForm" class="mt-4 border-t border-slate-800 pt-4">
            <FonteForm
              ref="formRef"
              :salvando="salvando"
              @salvar="salvarFonte"
              @cancelar="mostrandoForm = false"
            />
          </div>
        </BaseCard>
      </div>

      <!-- Coluna da direita: a importação do arquivo -->
      <div class="space-y-5 lg:col-span-8">
        <BaseCard
          destaque
          titulo="Importar arquivo"
          descricao="O arquivo original é preservado, sem alterações, na zona bruta do GeoDataLake —
                     junto com um hash de integridade e o carimbo de data e hora do recebimento."
        >
          <FonteUpload
            ref="uploadRef"
            :fonte="selecionada"
            :enviando="enviando"
            :progresso="progresso"
            @enviar="enviar"
          />
        </BaseCard>

        <BaseCard v-if="selecionada" titulo="Arquivos recebidos" icone="arquivo">
          <ArquivoList
            :fonte="selecionada"
            :em-processamento="emProcessamento"
            :resultados="resultados"
            :excluindo="excluindo"
            @processar="processar"
            @excluir="excluir"
          />
        </BaseCard>
      </div>
    </div>
  </div>
</template>
