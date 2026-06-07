import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <div className="text-5xl">🔍</div>
      <h1 className="mt-2 text-xl font-bold">Página não encontrada</h1>
      <Link
        href="/jogos"
        className="mt-4 inline-block text-brand hover:underline"
      >
        Voltar para os jogos
      </Link>
    </div>
  );
}
