<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import BaseButton from '@/components/BaseButton.vue'

/**
 * Formulário de regras de UMA coluna. Como o FonteForm, não chama a API:
 * só emite 'salvar' com o corpo pronto; quem faz o POST é o ModalMapeamento.
 *
 * Sugestão automática: ao abrir, o campo de destino vem com o MESMO NOME da
 * coluna de origem e o tipo de dado com o tipo detectado. Tudo editável.
 *
 * Os blocos aparecem conforme o tipo escolhido, espelhando o que o back aceita:
 *   GEOMETRIA → política da geometria (obrigatória) e conferência do Paraná
 *   DATA      → formato de origem
 *   TEXTO     → domínio de valores, referência cruzada e validação de CPF/CNPJ
 */
const props = defineProps({
  coluna: { type: Object, required: true },
  dominios: { type: Array, default: () => [] },
  referencias: { type: Array, default: () => [] },
  salvando: { type: Boolean, default: false },
  /** mensagem de erro do último salvar (400, 404, 409...) */
  erro: { type: String, default: '' },
})

const emit = defineEmits(['salvar', 'cancelar'])

const tipos = ['TEXTO', 'INTEIRO', 'DECIMAL', 'DATA', 'BOOLEANO', 'GEOMETRIA']
const politicas = [
  { valor: 'QUARENTENA', rotulo: 'Quarentena (reprova e isola o registro)' },
  { valor: 'CORRIGIR_E_REGISTRAR', rotulo: 'Corrigir e registrar' },
]
// Sugestões, não lista fechada: o back aceita qualquer tabela de destino válida.
const tabelasSugeridas = ['imovel_rural', 'municipio']

function formularioInicial(coluna) {
  const tipo = String(coluna.tipo ?? '').toUpperCase()
  return {
    destinoTabela: '',
    campoDestino: String(coluna.nome ?? '').toLowerCase(),
    tipoDado: tipos.includes(tipo) ? tipo : 'TEXTO',
    formatoOrigem: '',
    obrigatorio: false,
    chave: false,
    bloquearRegressao: false,
    validarCpfCnpj: false,
    politicaGeometria: tipo === 'GEOMETRIA' ? 'QUARENTENA' : '',
    recortarPr: false,
    dominioId: '',
    referenciaCruzada: '',
  }
}

const form = ref(formularioInicial(props.coluna))
const raiz = ref(null)

// Outra coluna escolhida: recomeça do zero com a sugestão dela.
watch(
  () => props.coluna.id,
  () => (form.value = formularioInicial(props.coluna)),
)

const ehGeometria = computed(() => form.value.tipoDado === 'GEOMETRIA')
const ehData = computed(() => form.value.tipoDado === 'DATA')
const ehTexto = computed(() => form.value.tipoDado === 'TEXTO')

// Chave exige obrigatório: ligar a chave já liga o obrigatório.
watch(
  () => form.value.chave,
  (chave) => {
    if (chave) form.value.obrigatorio = true
  },
)

// Trocar para GEOMETRIA sugere a política padrão.
watch(
  () => form.value.tipoDado,
  (tipo) => {
    if (tipo === 'GEOMETRIA' && !form.value.politicaGeometria) {
      form.value.politicaGeometria = 'QUARENTENA'
    }
  },
)

function vazioParaNulo(valor) {
  const v = typeof valor === 'string' ? valor.trim() : valor
  return v === '' || v === undefined ? null : v
}

/** Monta o MapeamentoRequest: só manda o que faz sentido para o tipo escolhido. */
function submeter() {
  const f = form.value
  emit('salvar', {
    colunaId: props.coluna.id,
    destinoTabela: f.destinoTabela.trim(),
    campoDestino: f.campoDestino.trim(),
    tipoDado: f.tipoDado,
    formatoOrigem: ehData.value ? vazioParaNulo(f.formatoOrigem) : null,
    obrigatorio: f.obrigatorio,
    chave: f.chave,
    bloquearRegressao: f.bloquearRegressao,
    validarCpfCnpj: ehTexto.value ? f.validarCpfCnpj : false,
    politicaGeometria: ehGeometria.value ? f.politicaGeometria : null,
    recortarPr: ehGeometria.value ? f.recortarPr : false,
    dominioId: ehTexto.value && f.dominioId !== '' ? Number(f.dominioId) : null,
    referenciaCruzada: ehTexto.value ? vazioParaNulo(f.referenciaCruzada) : null,
  })
}

onMounted(() => raiz.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
</script>

<template>
  <form ref="raiz" class="space-y-4" @submit.prevent="submeter">
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div>
        <label class="label" for="destinoTabela">Tabela de destino</label>
        <input
          id="destinoTabela"
          v-model="form.destinoTabela"
          class="input font-mono"
          list="tabelas-sugeridas"
          placeholder="imovel_rural"
          required
        />
        <datalist id="tabelas-sugeridas">
          <option v-for="t in tabelasSugeridas" :key="t" :value="t" />
        </datalist>
      </div>

      <div>
        <label class="label" for="campoDestino">Campo de destino</label>
        <input
          id="campoDestino"
          v-model="form.campoDestino"
          class="input font-mono"
          placeholder="tipo_imovel"
          required
        />
      </div>

      <div>
        <label class="label" for="tipoDado">Tipo de dado</label>
        <select id="tipoDado" v-model="form.tipoDado" class="input">
          <option v-for="t in tipos" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
    </div>

    <!-- Regras gerais -->
    <fieldset class="rounded-xl border border-slate-800 p-3">
      <legend class="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Regras gerais
      </legend>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label class="flex items-center gap-2 text-sm text-slate-300">
          <input v-model="form.obrigatorio" type="checkbox" class="accent-cyan-500" :disabled="form.chave" />
          Obrigatório
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-300">
          <input v-model="form.chave" type="checkbox" class="accent-cyan-500" />
          Chave (identifica o registro)
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-300">
          <input v-model="form.bloquearRegressao" type="checkbox" class="accent-cyan-500" />
          Bloquear regressão
        </label>
      </div>
      <p v-if="form.chave" class="mt-2 text-xs text-slate-500">
        Uma coluna chave é sempre obrigatória.
      </p>
    </fieldset>

    <!-- Só para GEOMETRIA -->
    <fieldset v-if="ehGeometria" class="rounded-xl border border-slate-800 p-3">
      <legend class="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Geometria
      </legend>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label class="label" for="politicaGeometria">Política para geometria inválida</label>
          <select id="politicaGeometria" v-model="form.politicaGeometria" class="input" required>
            <option v-for="p in politicas" :key="p.valor" :value="p.valor">{{ p.rotulo }}</option>
          </select>
        </div>
        <label class="flex items-start gap-2 pt-6 text-sm text-slate-300">
          <input v-model="form.recortarPr" type="checkbox" class="mt-0.5 accent-cyan-500" />
          <span>
            Conferir se está no Paraná
            <span class="block text-xs text-slate-500">
              Totalmente fora reprova e vai para a quarentena; parcialmente fora passa sem recorte.
            </span>
          </span>
        </label>
      </div>
    </fieldset>

    <!-- Só para DATA -->
    <div v-if="ehData">
      <label class="label" for="formatoOrigem">Formato da data na origem</label>
      <input
        id="formatoOrigem"
        v-model="form.formatoOrigem"
        class="input font-mono"
        placeholder="dd/MM/yyyy"
      />
    </div>

    <!-- Só para TEXTO -->
    <fieldset v-if="ehTexto" class="rounded-xl border border-slate-800 p-3">
      <legend class="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Validações de texto
      </legend>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label class="label" for="dominioId">Domínio de valores</label>
          <select id="dominioId" v-model="form.dominioId" class="input">
            <option value="">Nenhum</option>
            <option v-for="d in dominios" :key="d.id" :value="d.id">
              {{ d.codigo }} — {{ d.nome }}
            </option>
          </select>
        </div>
        <div>
          <label class="label" for="referenciaCruzada">Conferir existência em</label>
          <select id="referenciaCruzada" v-model="form.referenciaCruzada" class="input">
            <option value="">Nenhuma</option>
            <option v-for="r in referencias" :key="r.codigo" :value="r.codigo">{{ r.nome }}</option>
          </select>
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-300">
          <input v-model="form.validarCpfCnpj" type="checkbox" class="accent-cyan-500" />
          Validar CPF/CNPJ
        </label>
      </div>
    </fieldset>

    <p
      v-if="erro"
      class="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
    >
      {{ erro }}
    </p>

    <div class="flex items-center justify-end gap-2">
      <BaseButton type="button" variante="fantasma" @click="$emit('cancelar')">Cancelar</BaseButton>
      <BaseButton type="submit" :carregando="salvando">Salvar mapeamento</BaseButton>
    </div>
  </form>
</template>