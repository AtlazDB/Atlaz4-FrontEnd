# GeoRural DataHub — Front-end

Plataforma de governança, controle de qualidade e rastreabilidade de dados ambientais de imóveis
rurais. Este repositório contém o front-end da aplicação: Vue 3 (Composition API) + Vite +
Tailwind CSS + Axios.

---

## Pré-requisitos

| Ferramenta | Versão mínima | Como conferir |
|---|---|---|
| [Node.js](https://nodejs.org) | 18 | `node -v` |
| npm (vem com o Node) | 9 | `npm -v` |
| [Git](https://git-scm.com) | — | `git --version` |

O back-end ainda não está pronto. Enquanto isso, o repositório traz um **mock da API** que sobe
junto com a aplicação — não é preciso instalar banco de dados nem qualquer outro serviço.

---

## Passos para executar a aplicação

**1. Clone o repositório e entre na pasta**

```bash
git clone https://github.com/AtlazDB/Atlaz4-FrontEnd.git
cd Atlaz4-FrontEnd
```

**2. Instale as dependências**

```bash
npm install
```

**3. Crie o arquivo de variáveis de ambiente**

Copie o exemplo. Sem ele o Axios fica sem endereço de API e nenhuma chamada funciona.

```bash
cp .env.example .env.development     # Windows (PowerShell): copy .env.example .env.development
```

**4. Suba a aplicação**

```bash
npm run start
```

O comando levanta duas coisas ao mesmo tempo:

| | Endereço |
|---|---|
| Aplicação (Vite) | http://localhost:5173 |
| Mock da API | http://localhost:3333 |

**5. Acesse** http://localhost:5173 — o navegador abre sozinho.

Para encerrar, `Ctrl + C` no terminal.

---

### Outros comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | sobe só a aplicação |
| `npm run mock` | sobe só o mock da API |
| `npm run build` | gera a versão de produção em `dist/` |
| `npm run preview` | serve localmente o que o `build` gerou |
| `npm run arquivo-teste` | gera um CSV grande em `exemplos/` para testar o envio de arquivos |
