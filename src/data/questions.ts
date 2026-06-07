// Pool de 20 perguntas-base. Sao sorteadas 5 por jogo (iguais para todos).
// tipo: 'vencedor' | 'mais_menos' | 'sim_nao' | 'escolha' | 'placar'
// Para 'vencedor' e algumas 'escolha', as opcoes [A] e [B] sao substituidas
// pelos nomes dos times no momento de exibir o card.
// dificuldade define os pontos (facil 10 / media 20 / dificil 30).

export type QuestionSeed = {
  codigo: string;
  texto: string;
  tipo: "vencedor" | "mais_menos" | "sim_nao" | "escolha" | "placar";
  dificuldade: "facil" | "media" | "dificil";
  opcoes: string[];
};

export const QUESTION_POOL: QuestionSeed[] = [
  {
    codigo: "vencedor",
    texto: "Quem vence a partida?",
    tipo: "vencedor",
    dificuldade: "facil",
    opcoes: ["[A]", "Empate", "[B]"],
  },
  {
    codigo: "over_25",
    texto: "Total de gols: Mais ou Menos de 2.5?",
    tipo: "mais_menos",
    dificuldade: "facil",
    opcoes: ["Mais de 2.5", "Menos de 2.5"],
  },
  {
    codigo: "ambos_marcam",
    texto: "Os dois times marcam?",
    tipo: "sim_nao",
    dificuldade: "facil",
    opcoes: ["Sim", "Nao"],
  },
  {
    codigo: "escanteios_95",
    texto: "Total de escanteios: Mais ou Menos de 9.5?",
    tipo: "mais_menos",
    dificuldade: "media",
    opcoes: ["Mais de 9.5", "Menos de 9.5"],
  },
  {
    codigo: "cartao_vermelho",
    texto: "Havera cartao vermelho no jogo?",
    tipo: "sim_nao",
    dificuldade: "dificil",
    opcoes: ["Sim", "Nao"],
  },
  {
    codigo: "amarelos_45",
    texto: "Total de cartoes amarelos: Mais ou Menos de 4.5?",
    tipo: "mais_menos",
    dificuldade: "media",
    opcoes: ["Mais de 4.5", "Menos de 4.5"],
  },
  {
    codigo: "gol_1tempo",
    texto: "Sai gol no primeiro tempo?",
    tipo: "sim_nao",
    dificuldade: "media",
    opcoes: ["Sim", "Nao"],
  },
  {
    codigo: "var_anulado",
    texto: "Havera gol anulado pelo VAR?",
    tipo: "sim_nao",
    dificuldade: "dificil",
    opcoes: ["Sim", "Nao"],
  },
  {
    codigo: "penalti",
    texto: "Havera penalti marcado no jogo?",
    tipo: "sim_nao",
    dificuldade: "dificil",
    opcoes: ["Sim", "Nao"],
  },
  {
    codigo: "primeiro_gol",
    texto: "Qual time faz o primeiro gol?",
    tipo: "escolha",
    dificuldade: "media",
    opcoes: ["[A]", "[B]", "Nenhum (0x0)"],
  },
  {
    codigo: "placar_exato",
    texto: "Qual sera o placar exato?",
    tipo: "placar",
    dificuldade: "dificil",
    opcoes: [],
  },
  {
    codigo: "reserva_gol",
    texto: "Algum jogador reserva marca gol?",
    tipo: "sim_nao",
    dificuldade: "dificil",
    opcoes: ["Sim", "Nao"],
  },
  {
    codigo: "chutes_alvo_75",
    texto: "Total de finalizacoes no alvo: Mais ou Menos de 7.5?",
    tipo: "mais_menos",
    dificuldade: "media",
    opcoes: ["Mais de 7.5", "Menos de 7.5"],
  },
  {
    codigo: "gol_acrescimos",
    texto: "Havera gol nos acrescimos (90'+)?",
    tipo: "sim_nao",
    dificuldade: "dificil",
    opcoes: ["Sim", "Nao"],
  },
  {
    codigo: "margem_vitoria",
    texto: "Qual a margem de vitoria?",
    tipo: "escolha",
    dificuldade: "media",
    opcoes: ["Empate", "Por 1 gol", "Por 2 ou mais"],
  },
  {
    codigo: "mais_posse",
    texto: "Qual time tem mais posse de bola?",
    tipo: "escolha",
    dificuldade: "media",
    opcoes: ["[A]", "[B]"],
  },
  {
    codigo: "gol_contra",
    texto: "Havera gol contra no jogo?",
    tipo: "sim_nao",
    dificuldade: "dificil",
    opcoes: ["Sim", "Nao"],
  },
  {
    codigo: "1tempo_empate",
    texto: "O primeiro tempo termina empatado?",
    tipo: "sim_nao",
    dificuldade: "media",
    opcoes: ["Sim", "Nao"],
  },
  {
    codigo: "over_35",
    texto: "Total de gols: Mais ou Menos de 3.5?",
    tipo: "mais_menos",
    dificuldade: "media",
    opcoes: ["Mais de 3.5", "Menos de 3.5"],
  },
  {
    codigo: "vence_1tempo",
    texto: "Quem vence o primeiro tempo?",
    tipo: "escolha",
    dificuldade: "media",
    opcoes: ["[A]", "Empate", "[B]"],
  },
];
