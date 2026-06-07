import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { leagues, leagueMembers } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { JoinViaLink } from "@/components/JoinViaLink";

export const dynamic = "force-dynamic";

// Pagina de convite por link: /ligas/entrar/CODIGO
export default async function EntrarPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const cod = codigo.toUpperCase();
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/ligas/entrar/${cod}`);

  const [league] = await db
    .select()
    .from(leagues)
    .where(eq(leagues.codigo, cod))
    .limit(1);
  if (!league) {
    return (
      <p className="py-10 text-center text-gray-500">
        Liga nao encontrada para o codigo {cod}.
      </p>
    );
  }

  const [member] = await db
    .select({ id: leagueMembers.id })
    .from(leagueMembers)
    .where(
      and(
        eq(leagueMembers.leagueId, league.id),
        eq(leagueMembers.userId, user.id),
      ),
    )
    .limit(1);
  if (member) redirect(`/ligas/${cod}`);

  return (
    <div className="mx-auto mt-8 max-w-sm rounded-xl bg-white p-6 text-center card-shadow">
      <div className="text-4xl">🏆</div>
      <h1 className="mt-2 text-xl font-bold">Convite para a liga</h1>
      <p className="mt-1 font-semibold text-brand">{league.nome}</p>
      <p className="mb-4 text-sm text-gray-500">Código {cod}</p>
      <JoinViaLink codigo={cod} />
    </div>
  );
}
