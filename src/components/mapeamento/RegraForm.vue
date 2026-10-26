<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import BaseButton from '@/components/BaseButton.vue'

/**
 * Formulário de regras de UMA coluna. Como o FonteForm, não chama a API:
 * só emite 'salvar' com o corpo pronto; quem faz o POST (ou o PUT) é o MapeamentoPainel.
 *
 * Edição: com a prop `regra` (um item de GET /mapeamentos), abre preenchido com
 * ela; o campo de destino dela não conta como "já mapeado".
 *
 * Destino: a tabela e o campo são escolhidos numa lista (GET /destinos), com
 * os campos que a tabela realmente tem; o back recusa o que não estiver nela.
 * Sugestão automática: a tabela que a fonte já usa, o campo de MESMO NOME da
 * coluna de origem (se existir) e o tipo de dado do campo escolhido. Tudo editável.
 *
 * Os blocos aparecem conforme o tipo escolhido, espelhando o que o back aceita:
 *   GEOMETRIA → tipo esperado (polígono, ponto, linha), política da geometria
 *               (obrigatória) e conferência do Paraná
 *   DATA      → formato de origem (uma ou mais máscaras, ou EPOCH_MS)
 *   DECIMAL   → vírgula como separador (formato_origem VIRGULA)
 *   TEXTO     → domínio de valores, referência cruzada e validação de CPF/CNPJ
 */
const props = defineProps({
  coluna: { type: Object, required: true },
  /** o mapeamento sendo editado; null = mapeamento novo */
  regra: { type: Object, default: null },
  /** GET /destinos: [{ tabela, rotulo, campos: [{ nome, tipo, obrigatorio, observacao }] }] */
  destinos: { type: Array, default: () => [] },
  /** a tabela que a fonte já usa nos outros mapeamentos (uma fonte grava numa tabela) */
  tabelaSugerida: { type: String, default: '' },
  /** "tabela.campo" já ocupados por outra coluna desta fonte */
  camposUsados: { type: Array, default: () => [] },
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
const tiposGeometria = [
  { valor: 'POLIGONO', rotulo: 'Polígono (imóvel, reserva legal, município)' },
  { valor: 'PONTO', rotulo: 'Ponto (foco de calor)' },
  { valor: 'LINHA', rotulo: 'Linha (hidrografia, estrada)' },
]

function formularioInicial(coluna) {
  const tipo = String(coluna.tipo ?? '').toUpperCase()
  return {
    destinoTabela: props.tabelaSugerida || '',
    campoDestino: '',
    tipoDado: tipos.includes(tipo) ? tipo : 'TEXTO',
    formatoOrigem: '',
    tipoGeometria: 'POLIGONO',
    decimalComVirgula: false,
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

// O formato_origem guarda coisas diferentes conforme o tipo (ver formatoOrigem()).
function daRegra(r) {
  const formato = r.formatoOrigem ?? ''
  return {
    ...formularioInicial(props.coluna),
    destinoTabela: r.destinoTabela,
    campoDestino: r.campoDestino,
    tipoDado: r.tipoDado,
    formatoOrigem: r.tipoDado === 'DATA' ? formato : '',
    tipoGeometria: tiposGeometria.some((g) => g.valor === formato) ? formato : 'POLIGONO',
    decimalComVirgula: formato === 'VIRGULA',
    obrigatorio: r.obrigatorio,
    chave: r.chave,
    bloquearRegressao: r.bloquearRegressao,
    validarCpfCnpj: r.validarCpfCnpj,
    politicaGeometria: r.politicaGeometria ?? '',
    recortarPr: r.recortarPr,
    dominioId: r.dominioId ?? '',
    referenciaCruzada: r.referenciaCruzada ?? '',
  }
}

const inicial = () => (props.regra ? daRegra(props.regra) : formularioInicial(props.coluna))
const form = ref(inicial())
const raiz = ref(null)

const camposDaTabela = computed(
  () => props.destinos.find((d) => d.tabela === form.value.destinoTabela)?.campos ?? [],
)
const campoEscolhido = computed(() => camposDaTabela.value.find((c) => c.nome === form.value.campoDestino))

// O destino da própria regra em edição está livre para ela.
function ehDaRegra(tabela, campo) {
  return props.regra?.destinoTabela === tabela && props.regra?.campoDestino === campo
}

function ocupado(campo) {
  const tabela = form.value.destinoTabela
  return !ehDaRegra(tabela, campo.nome) && props.camposUsados.includes(`${tabela}.${campo.nome}`)
}

// Campo de mesmo nome da coluna, se a tabela tiver e estiver livre.
// Na edição, voltar para a tabela da regra traz de volta o campo dela.
function sugerirCampo() {
  if (props.regra?.destinoTabela === form.value.destinoTabela) {
    form.value.campoDestino = props.regra.campoDestino
    return
  }
  const nome = String(props.coluna.nome ?? '').toLowerCase()
  const igual = camposDaTabela.value.find((c) => c.nome === nome && !ocupado(c))
  form.value.campoDestino = igual ? igual.nome : ''
}

// Outra coluna (ou outro mapeamento) escolhida: recomeça do zero com a sugestão dela.
watch(
  () => [props.coluna.id, props.regra?.id],
  () => {
    form.value = inicial()
    sugerirCampo()
  },
)
// Os destinos chegam depois da primeira abertura (carregados junto com os domínios).
watch(() => props.destinos, sugerirCampo)

// Trocar a tabela recomeça a escolha do campo.
watch(() => form.value.destinoTabela, sugerirCampo)

// O campo escolhido diz o tipo do dado na tabela de destino.
// Na edição, o campo da própria regra mantém o tipo que já estava gravado.
watch(campoEscolhido, (campo) => {
  if (!campo) return
  form.value.tipoDado = ehDaRegra(form.value.destinoTabela, campo.nome) ? props.regra.tipoDado : campo.tipo
})

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

// formato_origem: a máscara da DATA, VIRGULA no DECIMAL ou o tipo da GEOMETRIA.
function formatoOrigem(f) {
  if (ehData.value) return vazioParaNulo(f.formatoOrigem)
  if (f.tipoDado === 'DECIMAL') return f.decimalComVirgula ? 'VIRGULA' : null
  if (ehGeometria.value) return f.tipoGeometria
  return null
}

/** Monta o MapeamentoRequest: só manda o que faz sentido para o tipo escolhido. */
function submeter() {
  const f = form.value
  emit('salvar', {
    colunaId: props.coluna.id,
    destinoTabela: f.destinoTabela.trim(),
    campoDestino: f.campoDestino.trim(),
    tipoDado: f.tipoDado,
    formatoOrigem: formatoOrigem(f),
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
        <select id="destinoTabela" v-model="form.destinoTabela" class="input" required>
          <option value="" disabled>Escolha a tabela</option>
          <option v-for="d in destinos" :key="d.tabela" :value="d.tabela">
            {{ d.rotulo }} — {{ d.tabela }}
          </option>
        </select>
      </div>

      <div>
        <label class="label" for="campoDestino">Campo de destino</label>
        <select
          id="campoDestino"
          v-model="form.campoDestino"
          class="input font-mono"
          :disabled="!form.destinoTabela"
          required
        >
          <option value="" disabled>{{ form.destinoTabela ? 'Escolha o campo' : 'Escolha a tabela antes' }}</option>
          <option v-for="c in camposDaTabela" :key="c.nome" :value="c.nome" :disabled="ocupado(c)">
            {{ c.nome }} · {{ c.tipo.toLowerCase() }}{{ c.obrigatorio ? ' · obrigatório' : '' }}{{ ocupado(c) ? ' · já mapeado' : '' }}
          </option>
        </select>
      </div>

      <div>
        <label class="label" for="tipoDado">Tipo de dado</label>
        <select id="tipoDado" v-model="form.tipoDado" class="input">
          <option v-for="t in tipos" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
    </div>
    <p v-if="campoEscolhido?.observacao" class="-mt-2 text-xs text-slate-500">{{ campoEscolhido.observacao }}</p>
    <p v-else-if="campoEscolhido?.obrigatorio" class="-mt-2 text-xs text-slate-500">
      A tabela não aceita este campo vazio: marque &ldquo;Obrigatório&rdquo; para o registro sem valor
      ir para a quarentena em vez de falhar a carga.
    </p>

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
          <label class="label" for="tipoGeometria">Tipo esperado</label>
          <select id="tipoGeometria" v-model="form.tipoGeometria" class="input">
            <option v-for="g in tiposGeometria" :key="g.valor" :value="g.valor">{{ g.rotulo }}</option>
          </select>
        </div>
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
        placeholder="DD/MM/YYYY"
      />
      <p class="mt-1 text-xs text-slate-500">
        Máscara do Oracle (ex.: <span class="font-mono">YYYY/MM/DD HH24:MI:SS</span>). Mais de um
        formato na mesma coluna: separe com <span class="font-mono">|</span> (vale o primeiro que
        converter). Milissegundos desde 1970, como o ArcGIS: <span class="font-mono">EPOCH_MS</span>.
        Vazio: <span class="font-mono">DD/MM/YYYY</span>.
      </p>
    </div>

    <!-- Só para DECIMAL -->
    <label v-if="form.tipoDado === 'DECIMAL'" class="flex items-center gap-2 text-sm text-slate-300">
      <input v-model="form.decimalComVirgula" type="checkbox" class="accent-cyan-500" />
      A origem usa vírgula como separador decimal (ex.: 25,9)
    </label>

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
      <BaseButton type="submit" :carregando="salvando">
        {{ regra ? 'Salvar alterações' : 'Salvar mapeamento' }}
      </BaseButton>
    </div>
  </form>
</template>