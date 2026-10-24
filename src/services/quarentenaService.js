
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

  // GeoJSON da geometria como chegou; 204 (data vazio) quando ela não pôde ser lida.
  obterGeometria(id) {
    return http.get(`/quarentena/${id}/geometria`);
  },

  // A geometria salva pelo operador; 204 enquanto não houver correção.
  obterGeometriaCorrigida(id) {
    return http.get(`/quarentena/${id}/geometria-corrigida`);
  },

  // Prévia da correção automática (RECTIFY do Oracle): não grava nada.
  sugerirCorrecaoGeometria(id) {
    return http.post(`/quarentena/${id}/geometria/correcao-automatica`);
  },

  salvarGeometriaCorrigida(id, geometria, justificativa) {
    return http.put(`/quarentena/${id}/geometria-corrigida`, { geometria, justificativa });
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
