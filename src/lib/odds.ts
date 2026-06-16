import {
  ODD_MIN_PALPITES,
  ODD_MAX_PONTOS,
  ODD_MULT_MIN,
  ODD_MULT_MAX,
} from "./constants";

// Sistema de ODD "contrario" (a partir da Rodada 2).
// Ideia: se TODOS os palpites fossem divididos igualmente entre as K opcoes,
// cada opcao receberia a "fatia justa" (total / K) e pagaria exatamente a base
// (multiplicador = 1). A partir dai:
//   - opcao MAIS escolhida que a fatia justa (favorita) -> multiplicador < 1
//     (paga MENOS que a base)
//   - opcao MENOS escolhida (azarao) -> multiplicador > 1 (paga MAIS que a base)
//
// Formula (com suavizacao de Laplace para evitar valores malucos):
//   m = (total + K) / (K * (palpites_na_opcao + 1))
// Em distribuicao perfeitamente igual, m = 1 exatamente.
// O resultado e limitado entre ODD_MULT_MIN e ODD_MULT_MAX.
//
// IMPORTANTE: a odd que vale e a FINAL (distribuicao de todos os palpites no
// fechamento do mercado). Como ninguem muda palpite depois do fecho, calcular
// na hora da apuracao usando a distribuicao final e justo e igual para todos.
export function oddFor(nOption: number, total: number, k: number): number {
  if (total < ODD_MIN_PALPITES) return 1; // poucos palpites -> sem odd (paga a base)
  const kk = k > 0 ? k : 1;
  const m = (total + kk) / (kk * (nOption + 1));
  if (m < ODD_MULT_MIN) return ODD_MULT_MIN;
  if (m > ODD_MULT_MAX) return ODD_MULT_MAX;
  return m;
}

// Converte base x odd em pontos, respeitando o teto.
export function pontosForOdd(base: number, odd: number): number {
  return Math.min(Math.round(base * odd), ODD_MAX_PONTOS);
}

export function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
