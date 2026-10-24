import { ref, watch } from 'vue'

// O index.html aplica a classe antes do Vue montar, para a tela não piscar no tema errado.
const CHAVE = 'georural-tema'

function lerEscolha() {
  try {
    return localStorage.getItem(CHAVE) === 'claro'
  } catch {
    return false
  }
}

const claro = ref(lerEscolha())

watch(
  claro,
  (sim) => {
    document.documentElement.classList.toggle('claro', sim)
    try {
      localStorage.setItem(CHAVE, sim ? 'claro' : 'escuro')
    } catch {
      // sem localStorage (aba anônima): vale até recarregar
    }
  },
  { immediate: true },
)

export function useTema() {
  return {
    claro,
    alternar: () => (claro.value = !claro.value),
  }
}
