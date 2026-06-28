import { requireUser } from "@/lib/auth";
import { getFullRanking } from "@/lib/queries";
import { RankingTabs } from "@/components/RankingTabs";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const user = await requireUser();
  const full = await getFullRanking();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Ranking</h1>
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
