import { MARKET_CLOSE_SECONDS } from "./constants";

// Retorna true se o mercado para esse jogo ainda esta aberto para palpites.
export function isMarketOpen(
  kickoffAt: Date | string,
  status: string,
): boolean {
  if (status !== "agendado") return false;
  const kickoff = new Date(kickoffAt).getTime();
  const closeAt = kickoff - MARKET_CLOSE_SECONDS * 1000;
  return Date.now() < closeAt;
}

// Instante (ms) em que o mercado fecha.
export function marketCloseTime(kickoffAt: Date | string): number {
  return new Date(kickoffAt).getTime() - MARKET_CLOSE_SECONDS * 1000;
}

export function formatDateBR(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}

// Gera um codigo de liga legivel (6 caracteres alfanumericos sem ambiguidade).
export function generateLeagueCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
