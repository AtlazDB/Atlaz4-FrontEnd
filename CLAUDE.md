# GeoRural DataHub — contexto do projeto

Este arquivo é lido automaticamente pelo Claude Code ao abrir o repositório. Ele descreve o
domínio, o backlog, as convenções e as armadilhas já mapeadas. Leia antes de propor mudanças.

---

## 1. O que é o projeto

**GeoRural DataHub** é uma plataforma de **governança, controle de qualidade e rastreabilidade de
dados ambientais de imóveis rurais**, desenvolvida como projeto acadêmico (API — Aprendizagem por
Projetos Integrados, Fatec) para a **Visiona Tecnologia Espacial**. Equipe: **Atlaz**.

O problema central não é "mostrar dados no mapa". É responder, para qualquer número exibido na
tela, três perguntas: **de onde ele veio, por qual processamento passou, e qual versão dos dados o
produziu**. Um analista ambiental precisa conseguir justificar um indicador em auditoria. Por isso
as decisões de arquitetura privilegiam linhagem, versionamento imutável e separação explícita entre
dado bruto, dado tratado e dado publicado.

O recorte geográfico de referência é o **estado do Paraná** (mapa centrado em `-24.89, -51.55`,
zoom 7), com os biomas **Mata Atlântica** e **Cerrado**.

---

## 2. Glossário de domínio

Termos que aparecem no código e nas telas. Um agente que não conhece esses termos escreve nomes de
variáveis errados.

### Negócio / regulatório

| Termo | Significado |
|---|---|
| **CAR** | Cadastro Ambiental Rural — registro público obrigatório de imóveis rurais. É a fonte primária do projeto. |
| **APP** | Área de Preservação Permanente — faixas protegidas por lei (margens de rio, topos de morro, encostas). |
| **RL** | Reserva Legal — percentual do imóvel que deve manter vegetação nativa (20% no Sul/Sudeste, maior na Amazônia). |
| **Imóvel rural** | A unidade de análise do sistema. Identificado pelo código CAR. |
| **Embargo** | Restrição administrativa (IBAMA/ICMBio) sobre área com infração ambiental. |
| **Bioma** | Mata Atlântica e Cerrado no recorte do projeto. Muda a regra de cálculo de vários indicadores. |

### Indicadores ambientais

Sete indicadores calculados por imóvel. Cada um tem uma **regra de negócio** identificada por um
código `RN-*`, que é o que garante a auditabilidade do resultado.

| Sigla | Nome | Unidade | Regra |
|---|---|---|---|
| `ICV` | Cobertura vegetal nativa | % | `RN-ICV-Bioma` |
| `IRL` | Reserva Legal | ha | `RN-IRL-Min20pct` |
| `IAPP` | APP conservada | % | `RN-IAPP-Hidrografia` |
| `ISAP` | Áreas protegidas (UC, TI, quilombo) | % | `RN-ISAP-UC-TI-Quilombo` |
| `IAE` | Área embargada | % | `RN-IAE-Ibama-ICMBio` |
| `IDesmat` | Desmatamento | % | `RN-IDesmat-Prodes` |
| `IFC` | Focos de calor | por mil ha | `RN-IFC-Queimadas` |

Status possíveis de um indicador: `conforme` (verde), `alerta` (âmbar), `critico` (rosa),
`validacao` (ciano).

### Dados / arquitetura

| Termo | Significado |
|---|---|
| **GeoDataLake** | O repositório de dados, dividido em quatro zonas. |
| **Zona Bruta** | Dado como chegou da fonte, sem alteração. Preservado para auditoria. |
| **Zona Tratada** | Dado validado e padronizado (projeção, datas, unidades, nomes de município). |
| **Zona Publicada** | Versão liberada para consumo pelo portal e pela API. |
| **Zona Quarentena** | Registros que falharam na validação. Não avançam no pipeline até serem corrigidos ou descartados. |
| **Linhagem (lineage)** | O caminho completo de um dado, da fonte ao número exibido. |
| **Versionamento imutável** | Uma versão publicada nunca é editada. Correção gera nova versão; a anterior continua consultável. |
| **Hash de execução** | Identificador do processamento que gerou uma versão. É o que amarra número → execução → dados de entrada. |

### Pipeline (8 etapas)

```
Cadastro da fonte → Ingestão (zona bruta) → Validação / Quarentena →
Tratamento / Padronização → Cruzamento geoespacial → Qualidade / Versionamento →
Publicação da versão → Consumo (Portal / API)
```

As três primeiras etapas de trabalho do Operador de Dados (**cadastro/ingestão, validação,
padronização**) são exatamente o escopo da Sprint 1 — ver seção 3.

### Conjuntos de dados

Cinco conjuntos modelados: `imoveis_rurais` (Imóveis rurais), `app_hidrografica` (Área de
preservação permanente), `reserva_legal` (Reserva legal), `uso_cobertura` (Uso e cobertura do solo),
`municipios` (Malha municipal).

### Personas

**Operador de Dados** (ingere, valida e padroniza), **Analista** (consulta indicadores),
**Auditor** (verifica versões e origem), **Gestor** (controla acesso).

---

## 3. Backlog

| ID | Prioridade | User Story | Est. | Sprint |
|---|---|---|---|---|
| US01 | Alta | Como Operador de Dados, quero **cadastrar fontes de dados e importar seus arquivos** para que os dados recebidos sejam armazenados de forma íntegra e possam ser utilizados pela aplicação. | 5h | 1 |
| US02 | Alta | Como Operador de Dados, quero **validar os dados importados e identificar registros inválidos** para que inconsistências sejam identificadas e os dados confiáveis sejam separados dos que precisam de correção. | 8h | 1 |
| US03 | Alta | Como Operador de Dados, quero **padronizar os dados válidos** para que informações de diferentes fontes possam ser usadas de forma consistente nos cruzamentos e cálculos. | 8h | 1 |
| US04 | Alta | Como Analista, quero **consultar os indicadores ambientais** dos imóveis a partir do CAR e dos cruzamentos com outras fontes. | 8h | 2 |
| US05 | Alta | Como Auditor, quero **consultar o histórico das versões** dos dados e indicadores e sua origem, e comparar versões. | 8h | 2 |
| US06 | Média | Como Gestor, quero **controlar o acesso** às funcionalidades por perfil de usuário. | 5h | 2 |
| US07 | Média | Como Analista, quero **consultar os indicadores por meio de uma API** para usar os resultados em outros sistemas. | 5h | 3 |
| US08 | Baixa | Como Analista, quero **visualizar os imóveis em mapa, gráficos e tabelas** para analisar os indicadores visualmente. | 8h | 3 |

**Estamos na Sprint 1.** Mapa, gráficos, indicadores, versionamento, perfis de acesso e API estão
**fora do escopo atual**. Não introduza Leaflet, Chart.js, telas de auditoria ou controle de acesso
sem que o backlog avance — o protótipo da Sprint 1 é deliberadamente enxuto para não sugerir
funcionalidades que ainda não existem.

---

## 4. Este repositório

Front-end da aplicação. O back-end vive em outro repositório e **ainda não está pronto** — por isso
há um mock local aqui.

### Stack

Vue 3 (Composition API, `<script setup>`) · Vite 5 · Tailwind CSS 3 · Vue Router 4 · Axios ·
Express + Multer no mock. Sem TypeScript, sem Pinia, sem biblioteca de componentes — escolha
deliberada para manter o projeto legível por toda a equipe.

### Comandos

```bash
npm install
npm run start          # sobe mock (:3333) + Vite (:5173) juntos
npm run dev            # só o Vite
npm run mock           # só o mock da API
npm run build          # build de produção
npm run arquivo-teste  # gera exemplos/car_imoveis_15mb.csv para testar o upload
```

**Pré-requisito:** copie `.env.example` para `.env.development`. Sem `VITE_API_URL` o Axios fica
sem `baseURL` e toda chamada falha.

### Estrutura

```
src/
├── App.vue                  casca: manchas de luz, cabeçalho, trilha de etapas, rodapé
├── router/
│   ├── index.js             uma rota por etapa do fluxo
│   └── etapas.js            as três etapas; etapa sem tela fica com `rota: null`
├── services/
│   ├── http.js              instância única do Axios: baseURL do .env + interceptor
│   │                        que converte erro do Axios em Error com mensagem em pt-BR
│   └── fontesService.js     uma função por operação da API de fontes
├── components/
│   ├── layout/
│   │   ├── AppHeader.vue    barra superior: marca + usuário (fixo no código, sem login ainda)
│   │   ├── EtapasNav.vue    trilha das etapas; deriva tudo da rota atual, não guarda estado
│   │   └── AppFooter.vue
│   ├── AppIcon.vue          <AppIcon nome="upload" class="h-4 w-4" />
│   ├── icones.js            traçados dos SVG (fora do .vue: defineProps não enxerga
│   │                        variável declarada dentro do <script setup>)
│   ├── BaseCard.vue         cartão de vidro com slots `default` e `acoes`
│   ├── BaseButton.vue       variantes: primario | secundario | fantasma · tamanhos: sm | md
│   ├── StatusBadge.vue      etiqueta de status de fonte
│   └── fontes/
│       ├── FonteList.vue    lista; trata carregando / erro / vazio / preenchido
│       ├── FonteForm.vue    formulário de cadastro
│       └── FonteUpload.vue  drag-and-drop + barra de progresso
├── views/
│   └── ImportacaoView.vue   orquestra service ↔ componentes (a tela da etapa 1)
├── utils/formato.js         formatarTamanho, formatarDataHora
└── assets/main.css          Tailwind + classes .glass .glow .input .label

mock/server.js               API falsa com upload multipart real
scripts/gerar-arquivo-teste.js
```

**Acrescentar uma etapa**: crie a view, registre a rota em `router/index.js`, troque o `rota: null`
da etapa em `router/etapas.js` pelo nome da rota. A trilha do topo se ajusta sozinha.

### Convenções

**Props para baixo, eventos para cima.** Só as *views* conversam com os *services*. Componentes em
`components/` recebem dados por props e emitem eventos — nunca importam um service. Isso mantém os
componentes reaproveitáveis e testáveis.

**Um service por recurso.** `fontesService`, depois `conjuntosService`, etc. O service sempre
devolve o dado já desembrulhado do `.data` do Axios, e **não** faz `try/catch` — o interceptor em
`http.js` já normaliza a mensagem de erro, e quem decide o que exibir é o componente.

**Nomes em português.** Variáveis, funções, rotas e campos da API seguem o domínio em pt-BR
(`carregarFontes`, `enviando`, `progresso`, `arquivos`). Mantenha a consistência.

**Import com `@/`** em vez de caminhos relativos. O alias está no `vite.config.js`.

**Nada de gestão de projeto na interface.** "Sprint", "US01", "user story", número de TODO — isso é
vocabulário de planejamento da equipe, não do Operador de Dados que usa o sistema. Textos de tela,
rótulos e estados vazios falam do domínio (fonte, arquivo, zona bruta, validação). O backlog vive
aqui neste arquivo; a interface não o exibe.

**Ícones em SVG, nunca emoji** — `<AppIcon nome="camadas" class="h-4 w-4" />`, traçados em
`components/icones.js`.

**Estilo com utilitários do Tailwind.** O cartão de vidro do protótipo virou a classe `.glass`.
Paleta: fundo `#0b0f19`, ciano = dados/GIS, esmeralda = conformidade, âmbar = alerta/inconsistência,
índigo = rastreabilidade.

---

## 5. Estado atual

Repositório recém-criado como **scaffold com TODOs**. A infraestrutura está pronta e testada; a
lógica da tela de fontes está **deliberadamente vazia**, para ser implementada por um humano como
exercício da task. **Não implemente os TODOs sem que o usuário peça explicitamente.**

Task em andamento: *"Vue: tela de cadastro e importação — listagem (Axios) + formulário de upload com barra de
progresso. Pronto quando: cadastrar fonte, ver na lista, subir arquivo."* (US01)

Os 9 TODOs, agrupados em três blocos que entregam algo visível cada:

| # | Arquivo | O que falta |
|---|---|---|
| 1 | `services/fontesService.js` | `listarFontes()` — GET |
| 2 | `services/fontesService.js` | `criarFonte()` — POST |
| 3 | `services/fontesService.js` | `enviarArquivo()` — FormData + `onUploadProgress` |
| 4 | `components/fontes/FonteForm.vue` | `submeter()` — emitir `salvar` |
| 5 | `components/fontes/FonteUpload.vue` | `aoEscolher()` — ler `evento.target.files[0]` |
| 6 | `components/fontes/FonteUpload.vue` | `enviar()` — emitir `enviar` |
| 7 | `views/ImportacaoView.vue` | `carregar()` |
| 8 | `views/ImportacaoView.vue` | `salvarFonte()` |
| 9 | `views/ImportacaoView.vue` | `enviar()` — ligar o callback de progresso |

Ordem sugerida: 1+7 (listagem funciona) → 2+4+8 (cadastro funciona) → 3+5+6+9 (upload funciona).
`excluirFonte()` já está implementado no service como exemplo do padrão.

Esse fluxo foi verificado ponta a ponta antes da entrega: os 9 TODOs foram implementados numa cópia
temporária e testados com Playwright (listagem, cadastro, erro 409 de sigla duplicada, upload com
progresso, atualização do card, navegação). Passou. As instruções nos comentários levam a um
resultado funcional.

---

## 6. Contrato da API

O mock em `mock/server.js` implementa exatamente isto. Quando o back-end real subir, ajuste apenas
`VITE_API_URL` no `.env.development` — e, se as rotas divergirem, o `fontesService.js`.

| Método | Rota | Retorno |
|---|---|---|
| GET | `/fontes?busca=` | `200` — array de fontes |
| GET | `/fontes/:id` | `200` — fonte · `404` |
| POST | `/fontes` | `201` — fonte criada · `400` `{mensagem, campos}` · `409` sigla repetida |
| POST | `/fontes/:id/arquivos` | `201` — `{fonte, arquivo}` · `400` sem arquivo · `415` extensão recusada |
| DELETE | `/fontes/:id` | `204` · `404` |

Formato de uma fonte:

```jsonc
{
  "id": 1,
  "nome": "CAR — Cadastro Ambiental Rural",
  "sigla": "CAR",
  "orgao": "Serviço Florestal Brasileiro",
  "formato": "SHP",                    // CSV | GeoJSON | SHP | XLSX | JSON
  "periodicidade": "mensal",
  "status": "ativa",                   // ativa | pendente | inativa
  "criadaEm": "2026-02-10T13:20:00.000Z",
  "arquivos": [
    { "id": "arq_8f21c0", "nome": "car_pr_2026_02.zip", "tamanho": 18432119,
      "enviadoEm": "2026-02-10T13:31:00.000Z", "hash": "sha256:..." }
  ]
}
```

O upload é `multipart/form-data` com o campo **`arquivo`**. Extensões aceitas: `.csv .zip .geojson
.json .shp .xlsx .txt`. Limite 200 MB. Os dados do mock vivem em memória — reiniciar volta ao
estado inicial; os arquivos ficam em `mock/uploads/` (ignorada pelo git).

---

## 7. Armadilhas já mapeadas

Coisas que custaram tempo para descobrir. Não refaça esse caminho.

**A barra de progresso não pode ser testada com arquivo pequeno.** O `onUploadProgress` do Axios
mede bytes escritos no socket, não bytes processados pelo servidor. Em `localhost` o sistema
operacional aceita vários MB de uma vez no buffer de rede, e o navegador já considera esses bytes
enviados — a barra pula de 0% a 100% mesmo com o servidor lendo devagar. Use `npm run
arquivo-teste` (15 MB). Progresso medido: `0 → 28 → 39 → 49 → 59 → 68 → 78 → 88 → 97 → 100`; o
salto inicial até 28% é o buffer do SO enchendo.

**Pausar o socket no servidor não freia o upload.** Enquanto o Multer consome o `req`, o Node
retoma o socket sozinho e a pausa é desfeita. O freio que funciona está em `mock/server.js`: um
`Transform` dentro de um storage engine customizado, que libera os bytes aos poucos e deixa o
*backpressure* subir naturalmente pela cadeia até o navegador. Configurável por
`MOCK_UPLOAD_KBPS` (padrão 1500; `0` desliga) e `MOCK_LATENCIA_MS` (padrão 400).

**No Multer, o readable fica em `file.stream`**, não em `file`. Um storage engine que faz
`file.pipe(...)` quebra com `file.pipe is not a function`.

**Não defina `Content-Type` manualmente no upload.** O navegador precisa gerar o *boundary* do
multipart sozinho; escrever `'multipart/form-data'` na mão quebra o envio.

**Tailwind 3, não 4.** Escolha deliberada por estabilidade e pela configuração em
`tailwind.config.js`, que a equipe já conhece. Se for migrar para v4, é uma decisão de equipe, não
um detalhe de implementação.

**Multer fixado em 2.x.** A série 1.x tem CVEs conhecidas.

---

## 8. Protótipos de referência

Existem dois protótipos em HTML single-file (Tailwind via CDN + JS vanilla) que servem como
**especificação visual e funcional**. Eles não estão neste repositório — o usuário os tem
localmente e pode fornecê-los quando forem necessários.

**Protótipo completo** — o produto inteiro imaginado, com navegação lateral entre Painel, Catálogo,
Detalhe do conjunto, Ingestão, Execuções, Qualidade e Versões. Inclui mapa Leaflet do Paraná,
gráficos Chart.js, linha do tempo de linhagem e painel de auditoria de indicador. Cobre US01–US08,
ou seja, **muito além da sprint atual**. Serve para entender o destino, não para copiar agora.

**Protótipo da Sprint 1** — recorte honesto de US01/US02/US03: um wizard linear de três passos
(Importação → Validação → Padronização) para a persona Operador de Dados, sem mapa e sem gráficos.
É a referência visual e funcional correta para o trabalho atual — top bar, trilha de etapas e grid
4/8 já foram portados. O banner de escopo do protótipo **não** foi portado, por ser conteúdo de
gestão de projeto (ver seção 4).

Há também um guia didático em HTML explicando cada tela, filtro e termo técnico do protótipo
completo, publicado como artifact.

Ao portar uma tela do protótipo para Vue: preserve a identidade visual (classes Tailwind, paleta,
`.glass`), mas **não** copie o JS vanilla — reescreva como componentes seguindo as convenções da
seção 4.

---

## 9. Como trabalhar neste repositório

Responda em **português**. Comentários e nomes de código também.

**Não implemente os TODOs sem pedido explícito.** Eles são o exercício de aprendizado do usuário.
Se ele pedir ajuda com um TODO, prefira explicar o caminho e revisar o que ele escreveu a entregar
o código pronto — a menos que ele peça o código diretamente.

**Respeite o escopo da sprint.** Antes de adicionar uma dependência ou uma tela, verifique em qual
sprint aquilo cai (seção 3). Sugerir é bem-vindo; implementar fora do escopo, não.

**Verifique antes de afirmar que funciona.** `npm run build` para o front, e o mock respondendo para
o fluxo. Este projeto já tem histórico de bug encontrado só na verificação — a barra de progresso
"funcionando" que na verdade nunca saía de 0/100.

**Não escreva `node_modules/`, `dist/` ou `exemplos/` no git.** Já estão no `.gitignore`.
