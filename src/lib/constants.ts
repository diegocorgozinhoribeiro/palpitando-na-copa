// Quanto tempo antes do apito o mercado fecha (em segundos).
export const MARKET_CLOSE_SECONDS = 60;

// Total de perguntas por jogo: a de "quem vence" (obrigatoria) + 5 sorteadas.
export const QUESTIONS_PER_MATCH = 6;

// Limite de ligas por usuario (criadas + participando).
export const MAX_LEAGUES_PER_USER = 3;

// Pesos padrao por dificuldade (usados no seed; editaveis no admin).
export const DIFFICULTY_POINTS: Record<string, number> = {
  facil: 10,
  media: 20,
  dificil: 30,
};

export const STATUS = {
  AGENDADO: "agendado",
  FECHADO: "fechado",
  FINALIZADO: "finalizado",
} as const;

// ---------------------------------------------------------------------------
// Sistema de RODADAS
// A Copa e dividida em 5 rodadas (o ranking de cada rodada "zera"):
//   Rodada 1: jogos 1-24   (1a rodada da fase de grupos)
//   Rodada 2: jogos 25-48  (2a rodada da fase de grupos)
//   Rodada 3: jogos 49-72  (3a rodada da fase de grupos)
//   Rodada 4: jogos 73-96  (16 avos + oitavas)
//   Rodada 5: jogos 97-104 (quartas + semi + 3o lugar + final)
// ---------------------------------------------------------------------------
export const TOTAL_RODADAS = 5;

export function rodadaForOrdem(ordem: number): number {
  if (ordem <= 24) return 1;
  if (ordem <= 48) return 2;
  if (ordem <= 72) return 3;
  if (ordem <= 96) return 4;
  return 5;
}

// ---------------------------------------------------------------------------
// Sistema de ODD (a partir da Rodada 2)
// ---------------------------------------------------------------------------
// Minimo de palpites na pergunta para a odd "ativar". Abaixo disso paga a base.
export const ODD_MIN_PALPITES = 2;
// Teto de pontos que uma pergunta pode pagar com a odd.
export const ODD_MAX_PONTOS = 300;
// Perguntas que NAO entram no sistema de odd (pagam sempre a base).
export const NO_ODD_CODES = ["placar_exato"];

// ---------------------------------------------------------------------------
// Ranking GERAL por pontos de colocacao (estilo campeonato)
// A cada rodada, o jogador ganha pontos conforme a posicao naquela rodada.
// ---------------------------------------------------------------------------
const COLOCACAO_TABLE = [100, 88, 78, 70, 64, 59, 55, 52, 50, 48];

// pos e 1-based (1 = primeiro lugar). Apos a tabela, cai de 1 em 1 ate o piso 10.
export function colocacaoPontos(pos: number): number {
  if (pos <= COLOCACAO_TABLE.length) return COLOCACAO_TABLE[pos - 1];
  const last = COLOCACAO_TABLE[COLOCACAO_TABLE.length - 1];
  return Math.max(10, last - (pos - COLOCACAO_TABLE.length));
}
