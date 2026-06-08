import { requireUser } from "@/lib/auth";
import { getUserTotalPoints, getUserLeagues } from "@/lib/queries";
import { logoutAction } from "@/app/(auth)/actions";
import { DeleteAccountForm } from "@/components/DeleteAccountForm";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const user = await requireUser();
  const stats = await getUserTotalPoints(user.id);
  const ligas = await getUserLeagues(user.id);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Meu perfil</h1>
      <div className="rounded-xl bg-white p-5 card-shadow">
        <div className="text-lg font-semibold">{user.name}</div>
        <div className="text-sm text-gray-500">{user.email}</div>
        {user.isAdmin && (
          <span className="mt-1 inline-block rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand-dark">
            Administrador
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-white p-4 card-shadow">
          <div className="text-2xl font-black text-brand">{stats.pontos}</div>
          <div className="text-xs text-gray-500">pontos</div>
        </div>
        <div className="rounded-xl bg-white p-4 card-shadow">
          <div className="text-2xl font-black">{stats.acertos}</div>
          <div className="text-xs text-gray-500">acertos</div>
        </div>
        <div className="rounded-xl bg-white p-4 card-shadow">
          <div className="text-2xl font-black">{stats.palpites}</div>
          <div className="text-xs text-gray-500">palpites</div>
        </div>
      </div>
      <div className="rounded-xl bg-white p-4 card-shadow">
        <div className="mb-1 font-semibold">Ligas ({ligas.length}/3)</div>
        <ul className="text-sm text-gray-600">
          {ligas.map((l) => (
            <li key={l.id}>
              • {l.nome} ({l.codigo})
            </li>
          ))}
          {ligas.length === 0 && (
            <li className="text-gray-400">Nenhuma liga ainda.</li>
          )}
        </ul>
      </div>
      <form action={logoutAction}>
        <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
          Sair da conta
        </button>
      </form>

      <div className="mt-2 border-t border-gray-200 pt-4">
        <p className="mb-2 text-xs text-gray-400">
          Conforme a LGPD, você pode excluir sua conta e todos os seus dados a
          qualquer momento. Esta ação é permanente.
        </p>
        <DeleteAccountForm />
      </div>
    </div>
  );
}
