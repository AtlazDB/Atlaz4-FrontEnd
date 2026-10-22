
import http from './http';

export default {
  listar(params) {
    return http.get('/quarentena', { params });
  },

  obterMetricas() {
    return http.get('/quarentena/metricas');
  },

  obterPorId(id) {
    return http.get(`/quarentena/${id}`);
  },

  iniciarAnalise(id) {
    return http.post(`/quarentena/${id}/iniciar-analise`);
  },

  descartar(id, justificativa) {
    return http.post(`/quarentena/${id}/descartar`, { justificativa });
  },

  corrigir(id, payloadCorrigido) {
    return http.post(`/quarentena/${id}/corrigir`, { payloadCorrigido });
  },

  revalidar(id) {
    return http.post(`/quarentena/${id}/revalidar`);
  }
};
