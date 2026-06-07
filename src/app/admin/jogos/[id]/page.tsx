import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMatchWithQuestions, resolveOptions } from "@/lib/queries";
import { formatDateBR } from "@/lib/utils";
import { AdminResultsForm } from "@/components/AdminResultsForm";

export const dynamic = "force-dynamic";

export default async function AdminJogoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/admin/jogos/${id}`);
  if (!user.isAdmin)
    return <p className="py-10 text-center text-gray-500">Acesso restrito.</p>;

  const data = await getMatchWithQuestions(id);
  if (!data) notFound();
  const { match, questions } = data;

  const cards = questions.map((q) => ({
    mqId: q.mqId,
    texto: q.texto,
    tipo: q.tipo,
    pontos: q.pontos,
    opcoes: resolveOptions(q.opcoes ?? [], match.teamA, match.teamB),
    respostaCorreta: q.respostaCorreta,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-white p-5 card-shadow">
        <h1 className="text-xl font-bold">
          {match.teamA} x {match.teamB}
        </h1>
        <p className="text-sm text-gray-500">
          {formatDateBR(match.kickoffAt)} · status: {match.status}
        </p>
      </div>
      <AdminResultsForm
        matchId={match.id}
        cards={cards}
        scoreA={match.scoreA}
        scoreB={match.scoreB}
        finalizado={match.status === "finalizado"}
      />
    </div>
  );
}
