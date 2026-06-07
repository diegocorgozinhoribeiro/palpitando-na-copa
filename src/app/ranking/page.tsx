import { requireUser } from "@/lib/auth";
import { getGlobalRanking } from "@/lib/queries";
import { RankingTable } from "@/components/RankingTable";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const user = await requireUser();
  const ranking = await getGlobalRanking(100);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Ranking geral</h1>
      <p className="text-sm text-gray-500">
        Pontuação somada de todos os palpites corrigidos.
      </p>
      <RankingTable rows={ranking} highlightUserId={user.id} />
    </div>
  );
}
