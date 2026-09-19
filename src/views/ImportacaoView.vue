<script setup>
import { ref, onMounted } from 'vue'
import BaseCard from '@/components/BaseCard.vue'
import BaseButton from '@/components/BaseButton.vue'
import AppIcon from '@/components/AppIcon.vue'
import FonteList from '@/components/fontes/FonteList.vue'
import FonteForm from '@/components/fontes/FonteForm.vue'
import FonteUpload from '@/components/fontes/FonteUpload.vue'
import { listarFontes, criarFonte, enviarArquivo } from '@/services/fontesService'

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

// --- Aviso na tela (sucesso/erro) ---------------------------------
const aviso = ref(null) // { tipo: 'ok' | 'erro', texto: string }

function avisar(tipo, texto) {
  aviso.value = { tipo, texto }
  setTimeout(() => (aviso.value = null), 5000)
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
    const { fonte } = await enviarArquivo(selecionada.value.id, arquivo, (pct) => {
      progresso.value = pct
    })

    const i = fontes.value.findIndex((f) => f.id === fonte.id)
    if (i !== -1) fontes.value[i] = fonte
    selecionada.value = fonte

    uploadRef.value.limpar()
    avisar('ok', 'Arquivo enviado.')
  } catch (e) {
    avisar('erro', e.message)
  } finally {
    enviando.value = false
    progresso.value = 0
  }
}

function selecionar(fonte) {
  selecionada.value = fonte
  uploadRef.value?.limpar()
}

onMounted(carregar)
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
            <BaseButton
              variante="secundario"
              tamanho="sm"
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
      <div class="lg:col-span-8">
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
      </div>
    </div>
  </div>
</template>
