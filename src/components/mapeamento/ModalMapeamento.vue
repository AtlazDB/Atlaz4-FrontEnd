<script setup>
import { ref, watch } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'
import AppIcon from '@/components/AppIcon.vue'
import ColunasDetectadas from '@/components/mapeamento/ColunasDetectadas.vue'
import MapeamentosTabela from '@/components/mapeamento/MapeamentosTabela.vue'
import RegraForm from '@/components/mapeamento/RegraForm.vue'
import {
  listarColunas,
  listarMapeamentos,
  listarDominios,
  listarReferenciasCruzadas,
  criarMapeamento,
  excluirMapeamento,
} from '@/services/mapeamentosService'

/**
 * Modal de mapeamento de colunas de uma fonte.
 *
 * Aqui o modal é o "cérebro" do mapeamento (papel que a ImportacaoView tem
 * na tela de importação): ele carrega os dados e distribui por props para
 * os filhos de apresentação. Assim a ImportacaoView só abre e fecha.
 *
 * Emite 'alterado' sempre que um mapeamento é criado ou removido, para a
 * tela de fora atualizar o aviso de "colunas novas" da lista de fontes.
 *
 * Uso:
 *   <ModalMapeamento :aberto="mapeando" :fonte="selecionada"
 *                    @fechar="mapeando = false" @alterado="..." />
 */
const props = defineProps({
  aberto: { type: Boolean, default: false },
  /** a fonte inteira (precisa de id, sigla e nome) */
  fonte: { type: Object, default: null },
})

const emit = defineEmits(['fechar', 'alterado'])

// --- Colunas detectadas e mapeamentos -----------------------------
const colunas = ref([])
const mapeamentos = ref([])
const carregando = ref(false)
const erro = ref('')

// --- Formulário de regras -----------------------------------------
const emEdicao = ref(null) // a coluna que está sendo mapeada, ou null
const salvando = ref(false)
const erroForm = ref('')
const sucesso = ref('')
const removendo = ref([]) // ids de mapeamentos sendo removidos
const dominios = ref([])
const referencias = ref([])
let apoioCarregado = false

async function carregar() {
  if (!props.fonte) return
  carregando.value = true
  erro.value = ''
  try {
    // As duas listas andam juntas: remover um mapeamento muda as duas.
    const [c, m] = await Promise.all([listarColunas(props.fonte.id), listarMapeamentos(props.fonte.id)])
    colunas.value = c
    mapeamentos.value = m
  } catch (e) {
    colunas.value = []
    mapeamentos.value = []
    erro.value = e.message
  } finally {
    carregando.value = false
  }
}

// Domínios e referências mudam raramente: busca uma vez por abertura da tela.
async function carregarApoio() {
  if (apoioCarregado) return
  try {
    const [d, r] = await Promise.all([listarDominios(), listarReferenciasCruzadas()])
    dominios.value = d
    referencias.value = r
    apoioCarregado = true
  } catch (e) {
    erroForm.value = `Não deu para carregar domínios e referências: ${e.message}`
  }
}

async function iniciarMapeamento(coluna) {
  sucesso.value = ''
  erroForm.value = ''
  emEdicao.value = coluna
  await carregarApoio()
}

function cancelarMapeamento() {
  emEdicao.value = null
  erroForm.value = ''
}

async function salvar(corpo) {
  salvando.value = true
  erroForm.value = ''
  try {
    await criarMapeamento(props.fonte.id, corpo)
    sucesso.value = `Coluna "${emEdicao.value.nome}" mapeada.`
    emEdicao.value = null
    await carregar() // a coluna passa de "nova" para "mapeada"
    emit('alterado')
  } catch (e) {
    // 400 e 409 chegam com a mensagem pronta do back
    erroForm.value = e.message
  } finally {
    salvando.value = false
  }
}

/** Remove um mapeamento: a coluna volta a ser "nova". */
async function remover(mapeamento) {
  const confirmado = window.confirm(
    `Remover o mapeamento de "${mapeamento.colunaNome}"?\n\nA coluna volta a ficar sem destino e sem regras.`,
  )
  if (!confirmado || removendo.value.includes(mapeamento.id)) return

  removendo.value.push(mapeamento.id)
  erroForm.value = ''
  sucesso.value = ''
  try {
    await excluirMapeamento(props.fonte.id, mapeamento.id)
    sucesso.value = `Mapeamento de "${mapeamento.colunaNome}" removido.`
    await carregar()
    emit('alterado')
  } catch (e) {
    erro.value = e.message
  } finally {
    removendo.value = removendo.value.filter((x) => x !== mapeamento.id)
  }
}

// Recarrega toda vez que o modal abre (ou troca de fonte com ele aberto),
// para nunca mostrar dados de outra fonte. Fechar zera o formulário.
watch(
  () => [props.aberto, props.fonte?.id],
  ([aberto]) => {
    emEdicao.value = null
    erroForm.value = ''
    sucesso.value = ''
    if (aberto) carregar()
  },
  { immediate: true },
)
</script>

<template>
  <BaseModal
    :aberto="aberto"
    :titulo="`Mapear colunas${fonte ? ' — ' + fonte.sigla : ''}`"
    descricao="Defina para onde vai cada coluna dos arquivos desta fonte e quais regras de qualidade valem para ela."
    @fechar="$emit('fechar')"
  >
    <div
      v-if="sucesso"
      class="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10
             px-4 py-2.5 text-sm text-emerald-300"
    >
      <AppIcon nome="check" class="h-4 w-4 shrink-0" />
      {{ sucesso }}
    </div>

    <h3 class="mb-3 text-sm font-semibold text-white">Colunas detectadas</h3>
    <ColunasDetectadas
      :colunas="colunas"
      :carregando="carregando"
      :erro="erro"
      :selecionada-id="emEdicao?.id ?? null"
      @selecionar="iniciarMapeamento"
      @tentar-novamente="carregar"
    />

    <section v-if="emEdicao" class="mt-5 border-t border-slate-800 pt-5">
      <h3 class="mb-3 text-sm font-semibold text-white">
        Mapear <span class="font-mono text-cyan-300">{{ emEdicao.nome }}</span>
      </h3>
      <RegraForm
        :coluna="emEdicao"
        :dominios="dominios"
        :referencias="referencias"
        :salvando="salvando"
        :erro="erroForm"
        @salvar="salvar"
        @cancelar="cancelarMapeamento"
      />
    </section>

    <section v-if="!erro && !carregando" class="mt-5 border-t border-slate-800 pt-5">
      <h3 class="mb-3 text-sm font-semibold text-white">
        Colunas mapeadas
        <span class="ml-1 font-mono text-[11px] font-normal text-slate-500">
          {{ mapeamentos.length }}
        </span>
      </h3>
      <MapeamentosTabela :mapeamentos="mapeamentos" :removendo="removendo" @remover="remover" />
    </section>

    <template #rodape>
      <BaseButton variante="fantasma" @click="$emit('fechar')">Fechar</BaseButton>
    </template>
  </BaseModal>
</template>