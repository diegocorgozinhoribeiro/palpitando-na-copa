type Row = { userId: string; name: string; pontos: number; acertos: number };

export function RankingTable({
  rows,
  highlightUserId,
}: {
  rows: Row[];
  highlightUserId?: string;
}) {
  if (rows.length === 0)
    return <p className="text-sm text-gray-400">Ainda nao ha pontuacao.</p>;
  return (
    <div className="overflow-hidden rounded-xl bg-white card-shadow">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-400">
          <tr>
            <th className="px-4 py-2 w-10">#</th>
            <th className="px-4 py-2">Jogador</th>
            <th className="px-4 py-2 text-right">Acertos</th>
            <th className="px-4 py-2 text-right">Pontos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.userId}
              className={[
                "border-t border-gray-100",
                r.userId === highlightUserId
                  ? "bg-brand-light font-semibold"
                  : "",
              ].join(" ")}
            >
              <td className="px-4 py-2">
                {i + 1}
                {i === 0 ? " 🥇" : i === 1 ? " 🥈" : i === 2 ? " 🥉" : ""}
              </td>
              <td className="px-4 py-2">{r.name}</td>
              <td className="px-4 py-2 text-right text-gray-500">
                {r.acertos}
              </td>
              <td className="px-4 py-2 text-right font-bold text-brand">
                {r.pontos}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
