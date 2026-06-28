import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leagues } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getFullRanking } from "@/lib/queries";
import { RankingTabs } from "@/components/RankingTabs";

export const dynamic = "force-dynamic";

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const user = await requireUser();
  const [league] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.codigo, codigo.toUpperCase()))
    .limit(1);
  if (!league) notFound();
  const full = await getFullRanking(league.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-white p-5 card-shadow">
        <h1 className="text-2xl font-bold">{league.nome}</h1>
        <p className="text-sm text-gray-500">
          Código <span className="font-mono font-bold">{league.codigo}</span>
        </p>
        <p className="mt-1 break-all text-xs text-gray-400">
          Link de convite: {appUrl}/ligas/entrar/{league.codigo}
        </p>
      </div>
      <h2 className="text-lg font-semibold">Ranking da liga</h2>
      <RankingTabs
        rounds={full.rounds}
        currentRound={full.currentRound}
        perRound={full.perRound}
        geral={full.geral}
        highlightUserId={user.id}
      />
    </div>
  );
}
