import { ODD_MIN_PALPITES, ODD_MAX_PONTOS } from "./constants";

// Sistema de ODD "contrario" (a partir da Rodada 2).
// A odd de uma opcao cresce quanto MENOS gente palpitou nela.
// Formula com suavizacao de Laplace (evita odds malucas com poucos palpites):
//   odd = (total_de_palpites + K) / (palpites_na_opcao + 1)
// onde K = numero de opcoes da pergunta.
//
// IMPORTANTE: a odd que vale e a FINAL (distribuicao de todos os palpites no
// fechamento do mercado). Como ninguem muda palpite depois do fecho, calcular
// na hora da apuracao usando a distribuicao final e justo e igual para todos.
export function oddFor(nOption: number, total: number, k: number): number {
  if (total < ODD_MIN_PALPITES) return 1; // poucos palpites -> sem odd (paga a base)
  const odd = (total + k) / (nOption + 1);
  return odd < 1 ? 1 : odd; // piso 1 (nunca paga menos que a base)
}

// Converte base x odd em pontos, respeitando o teto.
export function pontosForOdd(base: number, odd: number): number {
  return Math.min(Math.round(base * odd), ODD_MAX_PONTOS);
}

export function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
