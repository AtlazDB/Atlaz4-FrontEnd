import axios from 'axios'

/**
 * Instância única do Axios usada por toda a aplicação.
 * Está pronta — você não precisa mexer aqui para fazer a task.
 *
 * A URL do servidor vem do arquivo .env.development (VITE_API_URL).
 * Quando o back-end de verdade estiver pronto, basta trocar essa
 * variável: nenhum componente muda.
 */
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60_000,
})

/**
 * Interceptor de erro: transforma qualquer falha do Axios numa Error
 * com mensagem legível em português, para o componente só precisar
 * fazer `catch (e) { erro.value = e.message }`.
 */
http.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const mensagem =
      erro.response?.data?.mensagem ||
      (erro.code === 'ECONNABORTED' && 'O servidor demorou demais para responder.') ||
      (!erro.response && 'Não foi possível falar com o servidor. Ele está rodando?') ||
      `Erro ${erro.response?.status} ao falar com o servidor.`

    return Promise.reject(Object.assign(new Error(mensagem), { original: erro }))
  },
)

export default http
