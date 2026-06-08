import Link from "next/link";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="mx-auto mt-8 max-w-sm rounded-xl bg-white p-6 text-center card-shadow">
        <h1 className="mb-2 text-xl font-bold">Link inválido</h1>
        <p className="text-sm text-gray-600">
          O link de redefinição está incompleto ou expirou.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/esqueci-senha" className="text-brand hover:underline">
            Solicitar novo link
          </Link>
        </p>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
