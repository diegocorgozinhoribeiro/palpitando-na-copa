// Gera src/data/matches.json a partir do CSV oficial (src/data/copa_2026.csv).
// Rode com: node scripts/generateMatches.mjs
//
// - kickoffAt: convertido de horario de Brasilia (UTC-3) para ISO UTC.
// - definido: false para jogos de mata-mata ainda sem times reais
//   (placeholders como "2A", "1E", "3ABCDF", "Vencedor jogo 74").
//   Jogos nao definidos NAO aparecem para o usuario ate serem preenchidos.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const CSV = resolve(process.cwd(), "src/data/copa_2026.csv");
const OUT = resolve(process.cwd(), "src/data/matches.json");

// Brasilia (UTC-3) -> ISO UTC
function brToUtc(dateStr, hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCHours(h + 3, m, 0, 0);
  return d.toISOString();
}

// Detecta time "placeholder" (ainda nao definido).
function isPlaceholder(team) {
  const t = (team || "").trim();
  if (!t) return true;
  if (/vencedor|perdedor/i.test(t)) return true; // "Vencedor jogo 74"
  if (/^[0-9][A-Z]/.test(t)) return true; // "2A", "1E", "3ABCDF"
  return false;
}

function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  const header = lines[0].split(",");
  const idx = (name) => header.indexOf(name);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    rows.push({
      match_id: cols[idx("match_id")],
      fase: cols[idx("fase")],
      grupo: cols[idx("grupo")],
      data_brasilia: cols[idx("data_brasilia")],
      horario_brasilia: cols[idx("horario_brasilia")],
      time_casa: cols[idx("time_casa")],
      time_fora: cols[idx("time_fora")],
      estadio: cols[idx("estadio")],
    });
  }
  return rows;
}

const rows = parseCsv(readFileSync(CSV, "utf8"));
const matches = rows.map((r) => {
  const definido = !isPlaceholder(r.time_casa) && !isPlaceholder(r.time_fora);
  return {
    ordem: Number(r.match_id),
    fase: r.fase || null,
    grupo: r.grupo ? r.grupo.trim() : null,
    teamA: r.time_casa.trim(),
    teamB: r.time_fora.trim(),
    estadio: r.estadio ? r.estadio.trim() : null,
    cidade: null,
    kickoffAt: brToUtc(r.data_brasilia, r.horario_brasilia),
    status: "agendado",
    definido,
  };
});

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(matches, null, 2) + "\n", "utf8");

const def = matches.filter((m) => m.definido).length;
console.log(`Gerados ${matches.length} jogos -> ${OUT}`);
console.log(`  definidos (aparecem): ${def}`);
console.log(`  nao definidos (ocultos): ${matches.length - def}`);
