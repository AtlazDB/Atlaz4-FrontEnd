// Tipos de erro da tabela tipo_erro (V10 do back-end).
export const FAMILIAS = ['Geometria', 'Formato', 'Regra de negócio']

export const TIPOS_ERRO = {
  GEOMETRIA_NULA: {
    familia: 'Geometria',
    nome: 'Geometria nula',
    explica: 'O registro chegou sem geometria, e ela é obrigatória.',
    como: 'Desenhe o contorno no mapa ("Desenhar nova"), salve e revalide. Ou confira o arquivo de origem: o contorno pode ter se perdido na exportação.',
  },
  GEOMETRIA_MALFORMADA: {
    familia: 'Geometria',
    nome: 'Geometria malformada',
    explica: 'A geometria não pôde ser lida, então não dá para desenhá-la nem calcular área.',
    como: 'Desenhe o contorno no mapa ("Desenhar nova"), salve e revalide. Ou corrija as coordenadas na origem e envie o arquivo de novo.',
  },
  GEOMETRIA_INVALIDA: {
    familia: 'Geometria',
    nome: 'Geometria inválida',
    explica: 'O contorno cruza a si mesmo ou não fecha. Sem corrigir, não dá para calcular área nem cruzar com outras camadas.',
    como: 'Use "Corrigir automaticamente" ou edite os vértices no mapa, salve e revalide. O ponto do problema aparece em vermelho.',
  },
  GEOMETRIA_TIPO_INCOMPATIVEL: {
    familia: 'Geometria',
    nome: 'Tipo de geometria incompatível',
    explica: 'Veio um tipo de geometria diferente do esperado, como um ponto onde devia haver um polígono.',
    como: 'Confira se o arquivo é da camada certa.',
  },
  FORA_DO_RECORTE_TERRITORIAL: {
    familia: 'Geometria',
    nome: 'Fora do Paraná',
    explica: 'O ponto ou polígono está fora do recorte territorial do projeto.',
    como: 'Normalmente é descarte: o dado não pertence ao Paraná.',
  },
  CAMPO_OBRIGATORIO_AUSENTE: {
    familia: 'Formato',
    nome: 'Campo obrigatório ausente',
    explica: 'Um campo obrigatório não veio no registro.',
    como: 'Preencha o campo na correção e revalide.',
  },
  CAMPO_EM_BRANCO: {
    familia: 'Formato',
    nome: 'Campo em branco',
    explica: 'O campo veio só com espaços ou com um falso nulo (NULL, N/A, -).',
    como: 'Preencha o valor correto na correção e revalide.',
  },
  TIPO_DE_DADO_INVALIDO: {
    familia: 'Formato',
    nome: 'Tipo de dado inválido',
    explica: 'O valor não pode ser convertido para o tipo esperado, como texto onde devia haver número.',
    como: 'Corrija o valor na correção e revalide.',
  },
  CPF_CNPJ_INVALIDO: {
    familia: 'Formato',
    nome: 'CPF/CNPJ inválido',
    explica: 'Os dígitos verificadores não conferem.',
    como: 'Confira o documento na origem. Se não houver como corrigir, descarte com justificativa.',
  },
  VALOR_FORA_DO_DOMINIO: {
    familia: 'Regra de negócio',
    nome: 'Valor fora da lista',
    explica: 'O valor não está na lista de valores permitidos para o campo.',
    como: 'Troque pelo valor correto da lista, ou peça a inclusão do valor novo no domínio.',
  },
  REFERENCIA_NAO_ENCONTRADA: {
    familia: 'Regra de negócio',
    nome: 'Referência não encontrada',
    explica: 'O código aponta para algo que não existe na base de referência, como um município inexistente.',
    como: 'Corrija o código ou carregue antes a base de referência atualizada.',
  },
  REGRESSAO_DE_VALOR: {
    familia: 'Regra de negócio',
    nome: 'Valor sumiu',
    explica: 'O campo tinha valor na carga anterior e chegou vazio agora.',
    como: 'Verifique se o órgão apagou o dado de propósito. Se não, recupere o valor da carga anterior.',
  },
  CHAVE_NATURAL_DUPLICADA: {
    familia: 'Regra de negócio',
    nome: 'Chave duplicada',
    explica: 'Mais de um registro com a mesma chave no mesmo arquivo.',
    como: 'Descarte a cópia errada ou corrija a chave na origem.',
  },
}

export function nomeErro(codigo) {
  if (!codigo) return 'Sem classificação'
  return TIPOS_ERRO[codigo]?.nome ?? codigo
}

export const STATUS = {
  PENDENTE: { rotulo: 'Pendente', classe: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
  EM_ANALISE: { rotulo: 'Em análise', classe: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' },
  CORRIGIDO: { rotulo: 'Corrigido', classe: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300' },
  REVALIDADO: { rotulo: 'Revalidado', classe: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
  DESCARTADO: { rotulo: 'Descartado', classe: 'border-slate-500/40 bg-slate-500/10 text-slate-300' },
  SUBSTITUIDO: { rotulo: 'Substituído', classe: 'border-slate-600/40 bg-slate-600/10 text-slate-400' },
}

// Mesma lista de QuarentenaService.STATUS_ENCERRADOS no back-end.
export const ENCERRADOS = ['REVALIDADO', 'DESCARTADO', 'SUBSTITUIDO']

const ENTIDADES = {
  imovel_rural: 'Imóvel rural',
  car_reserva_legal: 'Reserva Legal',
  foco_calor: 'Foco de calor',
}

export function nomeEntidade(entidade) {
  if (!entidade) return '—'
  return ENTIDADES[entidade.toLowerCase()] ?? entidade
}

/** Coordenada do problema escrita no motivo: "... em (-49.86, -25.07)" ou "[-49.86 -25.07]". */
export function pontoDoMotivo(motivo) {
  const achado = motivo?.match(/[([]\s*(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)\s*[)\]]/)
  return achado ? [Number(achado[1]), Number(achado[2])] : null
}

export function formatarPayload(texto) {
  if (!texto) return ''
  try {
    return JSON.stringify(JSON.parse(texto), null, 2)
  } catch {
    return texto
  }
}
