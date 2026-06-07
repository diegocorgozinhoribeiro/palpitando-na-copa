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
