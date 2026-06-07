import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listMatches } from "@/lib/queries";
import { formatDateBR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!user.isAdmin) {
    return (
      <p className="py-10 text-center text-gray-500">
        Acesso restrito a administradores.
      </p>
    );
  }
  const all = await listMatches();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel admin</h1>
        <Link
          href="/admin/perguntas"
          className="text-sm text-brand hover:underline"
        >
          Pontuação das perguntas →
        </Link>
      </div>
      <p className="text-sm text-gray-500">
        Abra um jogo para preencher o gabarito e finalizar (corrige os
        palpites).
      </p>
      <ul className="flex flex-col gap-2">
        {all.map((m) => (
          <li key={m.id}>
            <Link
              href={`/admin/jogos/${m.id}`}
              className="flex items-center justify-between rounded-xl bg-white px-4 py-3 card-shadow hover:bg-gray-50"
            >
              <div>
                <div className="font-semibold">
                  {m.teamA} <span className="text-gray-400">x</span> {m.teamB}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDateBR(m.kickoffAt)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!m.definido && (
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                    A definir
                  </span>
                )}
                {m.status === "finalizado" && m.scoreA != null && (
                  <span className="text-sm font-bold">
                    {m.scoreA}-{m.scoreB}
                  </span>
                )}
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    m.status === "finalizado"
                      ? "bg-gray-200 text-gray-600"
                      : m.status === "fechado"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700",
                  ].join(" ")}
                >
                  {m.status}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
