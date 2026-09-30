# Client - GeoRural DataHub
Interface web feita em Vue.js para o **GeoRural DataHub**, plataforma de governança e rastreabilidade de dados ambientais de imóveis rurais do Paraná (projeto Fatec para a Visiona — Tecnologia Espacial, equipe [AtlazDB](https://github.com/AtlazDB)).

A API (back-end) está em [Atlaz4-BackEnd](https://github.com/AtlazDB/Atlaz4-BackEnd).

**Stack:** Vue 3 (Composition API) · Vite · Tailwind CSS · Axios · Leaflet · Vue Router

# 🖥️ Telas
| Tela | Para quê |
| ---- | -------- |
| **Ingestão de dados** (`/importacao`) | Cadastrar fontes, enviar arquivos para a zona bruta e acompanhar o processamento (Recebido → Processando → Processado ou Rejeitado). Arquivos do CAR em `.zip` são processados automaticamente após o envio; os rejeitados podem ser reprocessados ou excluídos. |
| **Consulta territorial** (`/consulta`) | Ver os imóveis rurais do Paraná numa tabela paginada e num mapa, filtrando por município, situação no CAR e código do imóvel. |

# 🛠️ Pré-requisitos para rodar o projeto
- **Node.js 18+** (com npm 9+) - [Download](https://nodejs.org)
- **Git** - [Download](https://git-scm.com/downloads)
- **Back-end rodando** (só para a tela de Consulta territorial) - ver [Atlaz4-BackEnd](https://github.com/AtlazDB/Atlaz4-BackEnd)

# 🚀 Passos para executar a aplicação
<ol>

<li> <strong> Clone o repositório e navegue até o diretório do projeto </strong> </li>

```bash
git clone https://github.com/AtlazDB/Atlaz4-FrontEnd.git
cd Atlaz4-FrontEnd
```

<li> <strong> Instale as dependências </strong> </li>

```bash
npm install
```

<li> <strong> Crie o arquivo de variáveis de ambiente </strong> </li>

| Windows     | `copy .env.example .env.development` |
| ----------- | ------------------------------------ |
| **Linux/MacOS** | **`cp .env.example .env.development`** |

A variável `VITE_API_URL` define para onde o front manda as requisições. Sem esse arquivo nenhuma chamada à API funciona.

<li> <strong> Escolha com qual API rodar </strong> </li>

| Modo | `VITE_API_URL` no `.env.development` | Comando | Funciona |
| ---- | ------------------------------------ | ------- | -------- |
| **Mock** (sem back-end) | `http://localhost:3333` (o padrão) | `npm run start` | Só a tela de Ingestão de dados (fontes e envio de arquivos) |
| **Back-end real** | `http://localhost:8080/api/v1` | `npm run dev` | Tudo, incluindo processamento, exclusão e a Consulta territorial |

> [!IMPORTANT]
> O mock responde só às rotas de fontes e de envio de arquivos. Processamento, exclusão de arquivos, imóveis e municípios existem **apenas no back-end real**: para usar a tela de Consulta territorial, suba o back-end antes e aponte o `VITE_API_URL` para ele.

<li> <strong> Acesse a aplicação </strong> </li>

Abra http://localhost:5173 (o navegador abre sozinho). Para encerrar, `Ctrl + C` no terminal.

</ol>

# 📋 Outros comandos
| Comando | O que faz |
| ------- | --------- |
| `npm run dev` | Sobe só a aplicação (Vite, porta 5173) |
| `npm run mock` | Sobe só o mock da API (porta 3333) |
| `npm run start` | Sobe o mock e a aplicação juntos |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve localmente o que o `build` gerou |
| `npm run arquivo-teste` | Gera um CSV grande em `exemplos/` para testar o envio de arquivos |

# 🧪 Como verificar o projeto
O front-end ainda não tem testes automatizados. Para conferir se o projeto compila sem erros, execute:

```bash
npm run build
```
