/**
 * As três etapas pelas quais um arquivo passa dentro do GeoDataLake, na
 * ordem em que o Operador de Dados as executa. É o que a navegação do topo
 * (EtapasNav) desenha.
 *
 * `rota` aponta para o `name` de uma rota em src/router/index.js. Etapa que
 * ainda não tem tela fica com `rota: null` e aparece esmaecida, sem link —
 * quando a tela existir, basta preencher o nome da rota aqui.
 */
export const etapas = [
  {
    rota: 'importacao',
    rotulo: 'Cadastro & Importação',
  },
  {
    rota: null,
    rotulo: 'Validação',
  },
  {
    rota: null,
    rotulo: 'Padronização',
  },
]
