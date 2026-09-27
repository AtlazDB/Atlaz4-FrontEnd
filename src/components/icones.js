/**
 * Traçados dos ícones em SVG, no mesmo desenho do protótipo: contorno de
 * 24×24, sem preenchimento. Cada entrada é a lista de comandos `d` dos
 * <path> que formam o ícone.
 *
 * Fica fora do AppIcon.vue porque `defineProps()` não enxerga variáveis
 * declaradas dentro do <script setup> — e o validador da prop precisa
 * consultar este mapa.
 */
export const icones = {
  local: [
    'M12 21c-4.4-3.6-7-7.2-7-11a7 7 0 0 1 14 0c0 3.8-2.6 7.4-7 11z',
    'M14.6 10a2.6 2.6 0 1 1-5.2 0 2.6 2.6 0 0 1 5.2 0z',
  ],
  camadas: ['M12 3l9 4.5-9 4.5-9-4.5L12 3z', 'M3 12l9 4.5 9-4.5', 'M3 16.5l9 4.5 9-4.5'],
  mais: ['M12 5v14', 'M5 12h14'],
  upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3'],
  arquivo: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z', 'M14 3v5h5'],
  check: ['M5 13l4 4L19 7'],
  alerta: [
    'M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z',
    'M12 9v4',
    'M12 17h.01',
  ],
  atualizar: ['M21 12a9 9 0 1 1-3-6.7', 'M21 4v6h-6'],
  mapa: ['M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z', 'M9 4v14', 'M15 6v14'],
  tabela: ['M4 4h16v16H4z', 'M4 10h16', 'M4 15h16', 'M10 10v10'],
}
