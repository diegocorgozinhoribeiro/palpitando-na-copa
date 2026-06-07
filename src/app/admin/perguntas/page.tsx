import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { updateQuestionPointsAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const DIFF: Record<string, string> = {
  facil: "Fácil",
  media: "Média",
  dificil: "Difícil",
};

export default async function PerguntasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/perguntas");
  if (!user.isAdmin)
    return <p className="py-10 text-center text-gray-500">Acesso restrito.</p>;

  const pool = await db
    .select()
    .from(questions)
    .orderBy(asc(questions.dificuldade), asc(questions.texto));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Pontuação das perguntas</h1>
      <p className="text-sm text-gray-500">
        Ajuste os pontos de cada pergunta. Vale para as correções futuras.
      </p>
      <div className="flex flex-col gap-2">
        {pool.map((q) => (
          <form
            key={q.id}
            action={updateQuestionPointsAction}
            className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 card-shadow"
          >
            <input type="hidden" name="questionId" value={q.id} />
            <div>
              <div className="font-medium">{q.texto}</div>
              <div className="text-xs text-gray-400">
                {DIFF[q.dificuldade] ?? q.dificuldade} · {q.tipo}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                name="pontos"
                type="number"
                min={0}
                defaultValue={q.pontos}
                className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-center"
              />
              <button className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark">
                Salvar
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
